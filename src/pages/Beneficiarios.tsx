import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Download, 
  Eye, 
  Pencil, 
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Database
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn, formatDate } from '../lib/utils';
import api from '../lib/api';

import { useAuth } from '../context/AuthContext';

export const ListadoBeneficiarios: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLinea, setSelectedLinea] = useState(user?.rol === 'funcionario' ? '' : 'Todas las Líneas');
  const [lineas, setLineas] = useState<any[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBeneficiario, setSelectedBeneficiario] = useState<any>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Export State Variables
  const [exportType, setExportType] = useState<'todos' | 'rango'>('todos');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    setExportError('');
    try {
      const params: any = {};
      if (selectedLinea !== 'Todas las Líneas') {
        params.linea = selectedLinea;
      }
      if (exportType === 'rango') {
        if (!exportStartDate || !exportEndDate) {
          setExportError('Por favor seleccione ambas fechas.');
          setIsExporting(false);
          return;
        }
        params.startDate = exportStartDate;
        params.endDate = exportEndDate;
      }

      const response = await api.get('/beneficiarios/export', { params });
      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) {
        setExportError('No se encontraron registros para exportar con los filtros seleccionados.');
        setIsExporting(false);
        return;
      }

      // Helper to safely escape characters for the XML document
      const escapeXml = (unsafe: any) => {
        if (unsafe === undefined || unsafe === null) return '';
        return String(unsafe)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      // Helper to format Date exactly like "YYYY-MM" as shown in the mockup image 2
      const formatDateForExcel = (dateStr: any) => {
        if (!dateStr) return '';
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) {
            if (typeof dateStr === 'string' && dateStr.length >= 7) {
              return dateStr.substring(0, 7);
            }
            return dateStr;
          }
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          return `${year}-${month}`;
        } catch (e) {
          return dateStr;
        }
      };

      // Exact columns mapped in order of Image 2
      const columnsHeaders = [
        'FECHA DE REGISTRO',
        'NOMBRE',
        'TIPO DOCUMENTO',
        'IDENTIFICACIÓN',
        'GÉNERO',
        'RANGO DE EDAD',
        'COMUNA',
        'BARRIO',
        'CORREO ELECTRÓNICO',
        'NÚMERO CELULAR',
        'LÍNEA DE TRABAJO',
        '¿ESTUDIA?',
        'NIVEL EDUCATIVO',
        '¿LABORA/ESTUDIA?',
        '¿SABE LEER?',
        '¿SABE ESCRIBIR?',
        'TIPO DE VIVIENDA',
        'ÉTNIA',
        '¿RECIBE AYUDA?',
        'DISCAPACIDAD',
        'TIPO DE DISCAPACIDAD',
        '¿TIENE CERTIFICADO DISCAPACIDAD?',
        'NOMBRE DEL CUIDADOR/A',
        '¿TRABAJA?',
        '¿VÍCTIMA?',
        '¿DESPLAZADO?',
        'TIPO POBREZA',
        'MUJERES HOGAR',
        'NIÑOS HOGAR',
        'ADOLESCENTES HOGAR',
        'JÓVENES HOGAR',
        '¿MADRE CABEZA?',
        'NOMBRE MADRE CABEZA'
      ];

      // Array to keep track of the maximum character length for each column to auto-fit
      const maxColLengths = columnsHeaders.map(h => h.length);

      // Map values to row cells array to compute lengths
      data.forEach((b: any) => {
        const rowValues = [
          formatDateForExcel(b.fecha_registro),
          b.nombre_completo || '',
          b.tipo_documento || '',
          b.numero_documento || '',
          b.genero || '',
          b.rango_edad || '',
          b.comuna || '',
          b.barrio || '',
          b.correo_electronico || '',
          b.numero_celular || '',
          b.linea_nombre || b.linea_trabajo || 'General',
          b.estudia_actualmente ? 'Sí' : 'No',
          b.nivel_educativo || 'Ninguno',
          b.situacion_laboral || 'Desempleado',
          b.sabe_leer ? 'Sí' : 'No',
          b.sabe_escribir ? 'Sí' : 'No',
          b.tipo_vivienda || b.tenencia_vivienda || '',
          b.etnia || '',
          b.ayuda_humanitaria ? 'Sí' : 'No',
          b.tiene_discapacidad ? 'Sí' : 'No',
          b.tiene_discapacidad ? (b.tipo_discapacidad || 'Sí') : 'No',
          b.tiene_certificado_discapacidad ? 'Sí' : 'No',
          b.nombre_cuidadora || 'No',
          b.labora_cuidadora ? 'Sí' : 'No',
          b.victima_conflicto ? 'Sí' : 'No',
          b.eres_desplazado ? 'Sí' : 'No',
          b.tipo_pobreza || 'N/A',
          b.mujeres_hogar ?? 0,
          b.ninos_hogar ?? 0,
          b.adolescentes_hogar ?? 0,
          b.jovenes_hogar ?? 0,
          b.madre_cabeza_familia ? 'Sí' : 'No',
          b.nombre_madre_cabeza || 'N/A'
        ];

        rowValues.forEach((val, colIndex) => {
          const sVal = String(val ?? '');
          if (sVal.length > maxColLengths[colIndex]) {
            maxColLengths[colIndex] = sVal.length;
          }
        });
      });

      // Calculate tight, auto-adjusted Widths
      const columnsDef = columnsHeaders.map((header, colIndex) => {
        const maxLen = maxColLengths[colIndex];
        // 6.8px per character + spacing, with optimized narrow minimums
        let calculatedWidth = Math.ceil(maxLen * 6.8) + 5;
        
        // Boundaries to keep columns narrow and elegant
        if (calculatedWidth < 55) calculatedWidth = 55;
        if (calculatedWidth > 160) calculatedWidth = 160;

        return {
          header,
          width: calculatedWidth
        };
      });

      const xmlColumns = columnsDef.map(col => `<Column ss:Width="${col.width}"/>`).join('\n   ');

      // Blue background headers, white text, bold, wrapped
      const xmlHeaderRow = `
   <Row ss:Height="36">
     ${columnsDef.map(col => `
      <Cell ss:StyleID="header">
        <Data ss:Type="String">${escapeXml(col.header)}</Data>
      </Cell>`).join('\n     ')}
   </Row>
      `;

      // Map rows
      const xmlRows = data.map((b: any) => {
        const cells = [
          { val: formatDateForExcel(b.fecha_registro), style: 'cell_center_bold' },
          { val: b.nombre_completo || '', style: 'cell_left' },
          { val: b.tipo_documento || '', style: 'cell_left' },
          { val: b.numero_documento || '', style: 'cell_left' },
          { val: b.genero || '', style: 'cell_left' },
          { val: b.rango_edad || '', style: 'cell_center' },
          { val: b.comuna || '', style: 'cell_left' },
          { val: b.barrio || '', style: 'cell_left' },
          { val: b.correo_electronico || '', style: 'cell_left' },
          { val: b.numero_celular || '', style: 'cell_center' },
          { val: b.linea_nombre || b.linea_trabajo || 'General', style: 'cell_left' },
          { val: b.estudia_actualmente ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.nivel_educativo || 'Ninguno', style: 'cell_left' },
          { val: b.situacion_laboral || 'Desempleado', style: 'cell_left' },
          { val: b.sabe_leer ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.sabe_escribir ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.tipo_vivienda || b.tenencia_vivienda || '', style: 'cell_left' },
          { val: b.etnia || '', style: 'cell_left' },
          { val: b.ayuda_humanitaria ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.tiene_discapacidad ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.tiene_discapacidad ? (b.tipo_discapacidad || 'Sí') : 'No', style: 'cell_left' },
          { val: b.tiene_certificado_discapacidad ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.nombre_cuidadora || 'No', style: 'cell_left' },
          { val: b.labora_cuidadora ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.victima_conflicto ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.eres_desplazado ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.tipo_pobreza || 'N/A', style: 'cell_left' },
          { val: b.mujeres_hogar ?? 0, style: 'cell_center' },
          { val: b.ninos_hogar ?? 0, style: 'cell_center' },
          { val: b.adolescentes_hogar ?? 0, style: 'cell_center' },
          { val: b.jovenes_hogar ?? 0, style: 'cell_center' },
          { val: b.madre_cabeza_familia ? 'Sí' : 'No', style: 'cell_center' },
          { val: b.nombre_madre_cabeza || 'N/A', style: 'cell_left' }
        ];

        return `
   <Row ss:Height="21">
     ${cells.map(c => `
      <Cell ss:StyleID="${c.style}">
        <Data ss:Type="String">${escapeXml(c.val)}</Data>
      </Cell>`).join('\n     ')}
   </Row>
        `;
      }).join('');

      // Build overall Excel XML document
      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Red de Inclusión</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#000000"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A0B0C0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A0B0C0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A0B0C0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A0B0C0"/>
   </Borders>
   <Interior ss:Color="#0B56A0" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
  </Style>
  <Style ss:ID="cell_left">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <Style ss:ID="cell_center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <Style ss:ID="cell_center_bold">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Red de Inclusión">
  <Table>
   ${xmlColumns}
   ${xmlHeaderRow}
   ${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_beneficiarios_${new Date().toISOString().split('T')[0]}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportOpen(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      setExportError('Ocurrió un error al generar la exportación.');
    } finally {
      setIsExporting(false);
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('cfg_records_limit');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Keep pagination updated when localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('cfg_records_limit');
      if (saved) {
        setItemsPerPage(parseInt(saved, 10));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const fetchAndShowDetails = async (id: string) => {
    try {
      const response = await api.get(`/beneficiarios/${id}`);
      setSelectedBeneficiario(response.data);
    } catch (error) {
      console.error('Error fetching full beneficiary details:', error);
      alert('Error al cargar la información detallada.');
    }
  };

  const fetchBeneficiarios = async () => {
    setLoading(true);
    try {
      const lineaParam = selectedLinea !== 'Todas las Líneas' ? `&linea=${selectedLinea}` : '';
      const response = await api.get(`/beneficiarios?search=${searchTerm}${lineaParam}&page=${currentPage}&limit=${itemsPerPage}`);
      setBeneficiarios(response.data.data);
      setTotalRecords(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching beneficiarios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Lines of Work
  React.useEffect(() => {
    const fetchLineas = async () => {
      try {
        const response = await api.get('/lineas');
        const loadedLineas = response.data || [];
        setLineas(loadedLineas);

        if (user?.rol === 'funcionario') {
          const userLinea = loadedLineas.find((l: any) => l._id === user.lineaTrabajo || l.nombre === user.lineaTrabajo);
          if (userLinea) {
            setSelectedLinea(userLinea.nombre);
          } else {
            setSelectedLinea(user.lineaTrabajo || 'Todas las Líneas');
          }
        }
      } catch (error) {
        console.error('Error fetching lineas:', error);
        if (user?.rol === 'funcionario') {
          setSelectedLinea(user?.lineaTrabajo || 'Todas las Líneas');
        }
      }
    };
    fetchLineas();
  }, [user]);

  React.useEffect(() => {
    if (user?.rol === 'funcionario' && !selectedLinea) {
      return;
    }
    
    const timer = setTimeout(() => {
      fetchBeneficiarios();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedLinea, currentPage, itemsPerPage]);

  const handleDelete = async () => {
    if (!deleteId) return;
    if (user?.rol !== 'admin') {
      alert('No tiene permisos para realizar esta acción.');
      setDeleteId(null);
      return;
    }
    try {
      await api.delete(`/beneficiarios/${deleteId}`);
      fetchBeneficiarios();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar el registro.');
    }
  };

  const navigate = useNavigate();

  // Reset to page 1 on search or filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLinea, itemsPerPage]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Visual */}
      <div className="bg-gradient-to-r from-brand-green to-brand-blue rounded-3xl p-6 md:p-10 text-white shadow-xl shadow-brand-green/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <div className="w-16 h-16 shrink-0 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
            <Users size={32} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight leading-tight">Listado de Beneficiarios</h2>
            <p className="text-white/80 font-medium mt-1 flex flex-col sm:flex-row items-center gap-2 text-sm justify-center sm:justify-start">
              <Database size={16} className="hidden sm:block" />
              Sistema de Información Poblacional
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl hidden md:block" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-10 -mb-10 blur-2xl hidden md:block" />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Top Bar Actions */}
        <div className="p-4 md:p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 flex-1">
            <div className="relative shrink-0">
               <select 
                 value={selectedLinea}
                 onChange={(e) => setSelectedLinea(e.target.value)}
                 disabled={user?.rol === 'funcionario'}
                 className="w-full sm:w-auto pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-green appearance-none cursor-pointer sm:min-w-[200px] disabled:opacity-75 disabled:cursor-not-allowed"
               >
                 <option>Todas las Líneas</option>
                 {lineas.map(linea => (
                   <option key={linea._id} value={linea.nombre}>{linea.nombre}</option>
                 ))}
               </select>
            </div>

            <div className="relative flex-1 max-w-lg w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar beneficiario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-green outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          {user?.rol === 'admin' && (
            <button 
              onClick={() => setIsExportOpen(true)}
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-8 py-3.5 bg-brand-dark text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shrink-0"
            >
              <Download size={18} />
              EXPORTAR
            </button>
          )}

          {user?.rol === 'funcionario' && (
            <button 
              onClick={() => navigate('/registro')}
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-8 py-3.5 bg-brand-green text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-brand-green/20 shrink-0"
            >
              <Users size={18} />
              NUEVO REGISTRO
            </button>
          )}
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex justify-center">
               <div className="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-green text-white">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider rounded-tl-2xl">Nombre</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Identificación</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Línea de Trabajo</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Tipo de Discapacidad</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Nombre de la Cuidadora</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">¿Labora la Cuidadora?</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider rounded-tr-2xl text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beneficiarios.length === 0 ? (
                  <tr>
                     <td colSpan={7} className="p-20 text-center text-slate-400 font-medium italic">No se encontraron beneficiarios registrados.</td>
                  </tr>
                ) : (
                  beneficiarios.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">{b.nombre_completo}</td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">{b.numero_documento}</td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase">
                          {b.linea_nombre || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {b.tipo_discapacidad ? (
                          <span className="text-sm font-bold text-amber-500">{b.tipo_discapacidad}</span>
                        ) : (
                          <span className="text-sm font-bold text-slate-300">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">{b.nombre_cuidadora || 'N/A'}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-black uppercase",
                          b.labora_cuidadora ? "bg-green-100 text-green-700" : "bg-red-100 text-brand-red"
                        )}>
                          {b.labora_cuidadora ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => fetchAndShowDetails(b._id)}
                            title="Ver detalles"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 shadow-sm bg-white"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => navigate(`/registro?edit=${b._id}`)}
                            title="Editar"
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm bg-white"
                          >
                            <Pencil size={18} />
                          </button>
                          {user?.rol === 'admin' && (
                            <button 
                              onClick={() => setDeleteId(b._id)}
                              title="Eliminar"
                              className="p-2 text-brand-red hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shadow-sm bg-white"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-6">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Población total registrada: <span className="text-slate-900">{totalRecords}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mostrar:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-brand-green cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Página</span>
              <span className="w-8 h-8 bg-brand-green text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-brand-green/20">
                {currentPage}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">de {totalPages || 1}</span>
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog.Root open={!!selectedBeneficiario} onOpenChange={() => setSelectedBeneficiario(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden outline-none">
            <div className="bg-brand-green p-6 flex items-center justify-between">
              <Dialog.Title className="text-2xl font-display font-bold text-white">Detalles del Beneficiario</Dialog.Title>
              <Dialog.Description className="sr-only">
                Vista detallada de la información personal y socioeconómica del beneficiario seleccionado.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="p-2 text-white/50 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>
            
            <div className="p-10 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                <DetailRow label="Nombre Completo" value={selectedBeneficiario?.nombre_completo} />
                <DetailRow label="Tipo de Documento" value={selectedBeneficiario?.tipo_documento} />
                <DetailRow label="Número de Documento" value={selectedBeneficiario?.numero_documento} />
                <DetailRow label="Género" value={selectedBeneficiario?.genero} />
                <DetailRow label="Edad" value={selectedBeneficiario?.rango_edad} />
                <DetailRow label="Fecha de Registro" value={selectedBeneficiario?.fecha_registro ? formatDate(selectedBeneficiario.fecha_registro) : 'N/A'} />
                <DetailRow label="Línea de Trabajo" value={selectedBeneficiario?.linea_nombre} />
                <DetailRow label="Comuna" value={selectedBeneficiario?.comuna} />
                <DetailRow label="Barrio / Vereda" value={selectedBeneficiario?.barrio} />
                <DetailRow label="Celular" value={selectedBeneficiario?.numero_celular} />
                <DetailRow label="Correo Electrónico" value={selectedBeneficiario?.correo_electronico || 'N/A'} />
                <DetailRow label="Etnia" value={selectedBeneficiario?.etnia} />
                <DetailRow label="Hijos a Cargo" value={selectedBeneficiario?.hijos_a_cargo || '0'} />
                <DetailRow label="Nivel Educativo" value={selectedBeneficiario?.nivel_educativo} />
                <DetailRow label="Situación Laboral" value={selectedBeneficiario?.situacion_laboral} />
                <DetailRow label="Tenencia Vivienda" value={selectedBeneficiario?.tipo_vivienda || selectedBeneficiario?.tenencia_vivienda} />
                <DetailRow label="Tipo de Discapacidad" value={selectedBeneficiario?.tipo_discapacidad || 'N/A'} />
                <DetailRow label="Cuidadora" value={selectedBeneficiario?.nombre_cuidadora || 'N/A'} />
                
                {/* Migrantes Extra Fields */}
                <>
                  <DetailRow label="¿Eres Desplazado?" value={selectedBeneficiario?.eres_desplazado ? 'Sí' : 'No'} />
                  <DetailRow label="Tipo de Pobreza" value={selectedBeneficiario?.tipo_pobreza || 'N/A'} />
                  <DetailRow label="Mujeres en Hogar" value={selectedBeneficiario?.mujeres_hogar || '0'} />
                  <DetailRow label="Niños en Hogar" value={selectedBeneficiario?.ninos_hogar || '0'} />
                  <DetailRow label="Adolescentes en Hogar" value={selectedBeneficiario?.adolescentes_hogar || '0'} />
                  <DetailRow label="Jóvenes en Hogar" value={selectedBeneficiario?.jovenes_hogar || '0'} />
                  <DetailRow label="¿Madre Cabeza de Familia?" value={selectedBeneficiario?.madre_cabeza_familia ? 'Sí' : 'No'} />
                  {selectedBeneficiario?.madre_cabeza_familia && (
                    <DetailRow label="Nombre Madre Cabeza" value={selectedBeneficiario?.nombre_madre_cabeza || 'N/A'} />
                  )}
                </>
              </div>

              <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <div className="w-2 h-4 bg-brand-green rounded-full"></div>
                  Firma del Beneficiario
                </h4>
                {selectedBeneficiario?.firma ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center h-48 overflow-hidden shadow-inner">
                    <img src={selectedBeneficiario.firma} alt="Firma" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 h-48 flex items-center justify-center italic text-slate-300 font-display">
                    Sin firma registrada
                  </div>
                )}
                <p className="text-[10px] text-slate-400 text-center mt-3 uppercase font-bold tracking-widest">{selectedBeneficiario?.nombre_completo}</p>
              </div>

              <div className="mt-12">
                <h4 className="text-sm font-bold text-slate-400 capitalize mb-6 border-b border-slate-100 pb-2">Condiciones y Estados</h4>
                <div className="flex flex-wrap gap-3">
                  <Badge label="¿Sabe Leer?" active={selectedBeneficiario?.sabe_leer} />
                  <Badge label="¿Sabe Escribir?" active={selectedBeneficiario?.sabe_escribir} />
                  <Badge label="Discapacidad" active={selectedBeneficiario?.tiene_discapacidad} />
                  <Badge label="Certificado Discap." active={selectedBeneficiario?.tiene_certificado_discapacidad} />
                  <Badge label="Cuidadora Labora" active={selectedBeneficiario?.labora_cuidadora} />
                  <Badge label="Víctima Conflicto" active={selectedBeneficiario?.victima_conflicto} />
                  <Badge label="Estudia Actualmente" active={selectedBeneficiario?.estudia_actualmente} />
                  <Badge label="Ayuda Humanitaria" active={selectedBeneficiario?.ayuda_humanitaria} />
                  <Badge label="Desplazado" active={selectedBeneficiario?.eres_desplazado} />
                  <Badge label="Madre Cabeza" active={selectedBeneficiario?.madre_cabeza_familia} />
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <Dialog.Close asChild>
                  <button className="px-10 py-3 bg-brand-green/90 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-brand-green/20 hover:bg-brand-green transition-all">
                    CERRAR
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden outline-none">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 text-brand-red rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <Dialog.Title className="text-xl font-bold text-slate-800 mb-2">¿Confirmar eliminación?</Dialog.Title>
              <Dialog.Description className="text-slate-500 text-sm mb-8">Esta acción no se puede deshacer. Se eliminarán permanentemente los datos del beneficiario.</Dialog.Description>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-brand-red text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Export Modal */}
      <Dialog.Root open={isExportOpen} onOpenChange={(open) => {
        setIsExportOpen(open);
        if (!open) {
          setExportError('');
          setExportStartDate('');
          setExportEndDate('');
        }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden outline-none">
             <div className="bg-brand-green p-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-display font-bold text-white">Exportar Beneficiarios</Dialog.Title>
              <Dialog.Close asChild>
                <X size={20} className="text-white cursor-pointer" />
              </Dialog.Close>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tipo de Exportación</label>
                  <select 
                    value={exportType}
                    onChange={(e) => {
                      setExportType(e.target.value as 'todos' | 'rango');
                      setExportError('');
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    <option value="todos">Todos los Registros</option>
                    <option value="rango">Rango de Fechas (Fecha Registro)</option>
                  </select>
                </div>

                {exportType === 'rango' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Fecha Inicial</label>
                      <input 
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => {
                          setExportStartDate(e.target.value);
                          setExportError('');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-green"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Fecha Final</label>
                      <input 
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => {
                          setExportEndDate(e.target.value);
                          setExportError('');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-green"
                      />
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 font-semibold space-y-0.5">
                  <span className="block uppercase text-[8px] text-slate-400 font-black tracking-wider">Filtro de Trabajo Aplicado</span>
                  <span className="block text-slate-700">{selectedLinea}</span>
                </div>

                {exportError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-brand-red font-semibold leading-normal">
                    {exportError}
                  </div>
                )}
              </div>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-4 bg-brand-green hover:bg-emerald-700 text-white rounded-xl font-bold uppercase shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    GENERANDO EXCEL...
                  </>
                ) : (
                  'GENERAR EXCEL (CSV)'
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string, value: any }) => (
  <div className="flex flex-wrap items-center gap-1">
    <span className="text-sm font-bold text-slate-800">{label}:</span>
    <span className="text-sm text-slate-600 font-medium">{value}</span>
  </div>
);

const Badge = ({ label, active }: { label: string, active: boolean }) => (
  <div className={cn(
    "px-4 py-2 rounded-full border text-[10px] font-bold transition-all",
    active 
      ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm" 
      : "bg-slate-50 text-slate-400 border-slate-200"
  )}>
    {label}: <span className={cn(active ? "text-blue-700" : "text-slate-500")}>{active ? 'Sí' : 'No'}</span>
  </div>
);
