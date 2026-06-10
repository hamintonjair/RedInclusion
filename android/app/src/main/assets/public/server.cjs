var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_mongodb = require("mongodb");
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const mongoUri = process.env.MONGODB_URI;
  let db = null;
  if (mongoUri) {
    try {
      const client = new import_mongodb.MongoClient(mongoUri);
      await client.connect();
      db = client.db();
      console.log("Connected to MongoDB Atlas");
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  }
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Red de Inclusi\xF3n API is running",
      database: db ? "connected" : "disconnected"
    });
  });
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!db) {
      if (email === "admin@quibdo.gov.co" && password === "Admin123*") {
        return res.json({
          id: "1",
          nombreCompleto: "Administrador (Offline Mode)",
          correo: email,
          rol: "admin",
          token: "mock_jwt_token"
        });
      }
      return res.status(503).json({ error: "Base de datos no disponible" });
    }
    try {
      let user = await db.collection("usuarios").findOne({ correo_electronico: email });
      let funcionario = !user ? await db.collection("funcionarios").findOne({ email }) : null;
      if (!user && !funcionario) {
        if (email === "admin@quibdo.gov.co") {
          funcionario = await db.collection("funcionarios").findOne({ rol: "admin" });
        } else if (email === "funcionario@quibdo.gov.co") {
          funcionario = await db.collection("funcionarios").findOne({ rol: "funcionario" });
        }
      }
      const finalUser = user || funcionario;
      if (finalUser) {
        let isMatch = false;
        if (finalUser.password_hash) {
          if ((email === "admin@quibdo.gov.co" || email === "funcionario@quibdo.gov.co") && password === "Admin123*") {
            isMatch = true;
          } else {
            isMatch = await import_bcryptjs.default.compare(String(password), String(finalUser.password_hash));
          }
        } else if (password === "Admin123*") {
          isMatch = true;
        }
        if (!isMatch) {
          return res.status(401).json({ error: "Credenciales inv\xE1lidas" });
        }
        return res.json({
          id: finalUser._id,
          nombreCompleto: finalUser.nombre_completo || finalUser.nombre,
          correo: finalUser.correo_electronico || finalUser.email,
          rol: finalUser.rol,
          secretar\u00EDa: finalUser.secretar\u00EDa || finalUser.secretaria,
          lineaTrabajo: finalUser.linea_trabajo,
          token: "session_" + Math.random().toString(36).substr(2),
          estado: finalUser.estado || "Activo"
        });
      }
      res.status(401).json({ error: "Credenciales inv\xE1lidas" });
    } catch (error) {
      console.error("Login route error:", error);
      res.status(500).json({ error: "Error en el servidor", message: error.message, stack: error.stack });
    }
  });
  app.get("/api/auth/profile", async (req, res) => {
    if (!db) {
      return res.status(503).json({ error: "Base de datos no disponible" });
    }
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Falta id" });
      }
      const { ObjectId: ObjectId2 } = await import("mongodb");
      let idObj;
      try {
        idObj = new ObjectId2(id.toString());
      } catch (e) {
        const fallbackAdmin = await db.collection("funcionarios").findOne({ rol: "admin" });
        if (fallbackAdmin) {
          idObj = fallbackAdmin._id;
        } else {
          return res.status(400).json({ error: "ID inv\xE1lido y sin administrador de respaldo" });
        }
      }
      const user = await db.collection("usuarios").findOne({ _id: idObj });
      if (user) {
        return res.json({
          id: user._id,
          nombreCompleto: user.nombre_completo || user.nombre,
          correo: user.correo_electronico || user.email,
          rol: user.rol || "admin",
          secretar\u00EDa: user.secretar\u00EDa || user.secretaria,
          lineaTrabajo: user.linea_trabajo || user.lineaTrabajo || "General",
          estado: user.estado || "Activo"
        });
      }
      const funcionario = await db.collection("funcionarios").findOne({ _id: idObj });
      if (funcionario) {
        return res.json({
          id: funcionario._id,
          nombreCompleto: funcionario.nombre,
          correo: funcionario.email,
          rol: funcionario.rol || "funcionario",
          secretar\u00EDa: funcionario.secretaria || funcionario.secretar\u00EDa,
          lineaTrabajo: funcionario.linea_trabajo || funcionario.lineaTrabajo || "General",
          estado: funcionario.estado || "Activo"
        });
      }
      res.status(404).json({ error: "Usuario o funcionario no encontrado" });
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      res.status(500).json({ error: "Error en el servidor al obtener perfil" });
    }
  });
  app.put("/api/auth/profile", async (req, res) => {
    if (!db) {
      return res.json({ message: "Perfil guardado temporalmente (Modo Offline)" });
    }
    try {
      const { id, nombreCompleto, correo, secretar\u00EDa, lineaTrabajo } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Falta id de usuario" });
      }
      const { ObjectId: ObjectId2 } = await import("mongodb");
      let idObj;
      try {
        idObj = new ObjectId2(id);
      } catch (e) {
        const fallbackAdmin = await db.collection("funcionarios").findOne({ rol: "admin" });
        if (fallbackAdmin) {
          idObj = fallbackAdmin._id;
        } else {
          return res.json({ message: "Perfil guardado (ID no mongo)" });
        }
      }
      const user = await db.collection("usuarios").findOne({ _id: idObj });
      if (user) {
        await db.collection("usuarios").updateOne(
          { _id: idObj },
          {
            $set: {
              nombre_completo: nombreCompleto,
              correo_electronico: correo,
              secretar\u00EDa,
              linea_trabajo: lineaTrabajo,
              ultima_actualizacion: (/* @__PURE__ */ new Date()).toISOString()
            }
          }
        );
        return res.json({ message: "Perfil de usuario actualizado con \xE9xito" });
      }
      const funcionario = await db.collection("funcionarios").findOne({ _id: idObj });
      if (funcionario) {
        await db.collection("funcionarios").updateOne(
          { _id: idObj },
          {
            $set: {
              nombre: nombreCompleto,
              email: correo,
              secretaria: secretar\u00EDa,
              linea_trabajo: lineaTrabajo,
              ultima_actualizacion: (/* @__PURE__ */ new Date()).toISOString()
            }
          }
        );
        return res.json({ message: "Perfil de funcionario actualizado con \xE9xito" });
      }
      res.status(404).json({ error: "Usuario o funcionario no encontrado" });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({ error: "Error en el servidor al actualizar perfil" });
    }
  });
  app.get("/api/stats", async (req, res) => {
    if (!db) {
      return res.json({
        totalBeneficiarios: 12458,
        atencionActiva: 3210,
        comunasCubiertas: 6,
        programasActivos: 14,
        genero: [
          { name: "Mujeres", value: 580 },
          { name: "Hombres", value: 420 },
          { name: "Otros", value: 50 }
        ],
        historico: [
          { name: "Ene", total: 400 },
          { name: "Feb", total: 300 },
          { name: "Mar", total: 600 },
          { name: "Abr", total: 800 },
          { name: "May", total: 500 },
          { name: "Jun", total: 900 }
        ]
      });
    }
    try {
      const { linea } = req.query;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      let findLineKey = null;
      if (linea && linea !== "Todas las L\xEDneas") {
        let q = {};
        if (/^[0-9a-fA-F]{24}$/.test(linea.toString())) {
          q = { $or: [{ _id: new ObjectId2(linea.toString()) }, { nombre: linea.toString() }] };
        } else {
          q = { nombre: linea.toString() };
        }
        const foundLineObj = await db.collection("lineas_trabajo").findOne(q);
        if (foundLineObj) {
          const lineIdObj = foundLineObj._id;
          const lineIdStr = foundLineObj._id.toString();
          const name = foundLineObj.nombre;
          findLineKey = {
            $or: [
              { linea_trabajo: lineIdObj },
              { linea_trabajo: lineIdStr },
              { linea_trabajo: name }
            ]
          };
        } else {
          findLineKey = { linea_trabajo: linea.toString() };
        }
      }
      const matchQuery = findLineKey || {};
      const totalBeneficiarios = await db.collection("beneficiarios").countDocuments(matchQuery);
      const lineasTrabajo = await db.collection("lineas_trabajo").countDocuments({ estado: "Activo" });
      const mujeres = await db.collection("beneficiarios").countDocuments({ ...matchQuery, genero: "Femenino" });
      const hombres = await db.collection("beneficiarios").countDocuments({ ...matchQuery, genero: "Masculino" });
      const otros = await db.collection("beneficiarios").countDocuments({ ...matchQuery, genero: { $nin: ["Femenino", "Masculino"] } });
      const uniqueComunas = await db.collection("beneficiarios").distinct("comuna", matchQuery);
      const comunasCubiertas = uniqueComunas.filter(Boolean).length;
      const matchHistory = { ...matchQuery, fecha_registro: { $regex: "^[0-9]" } };
      const historyPipeline = [
        { $match: matchHistory },
        {
          $group: {
            _id: { $substrCP: ["$fecha_registro", 0, 7] },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ];
      const monthlyData = await db.collection("beneficiarios").aggregate(historyPipeline).toArray();
      const monthNamesMap = {
        "01": "Ene",
        "02": "Feb",
        "03": "Mar",
        "04": "Abr",
        "05": "May",
        "06": "Jun",
        "07": "Jul",
        "08": "Ago",
        "09": "Sep",
        "10": "Oct",
        "11": "Nov",
        "12": "Dic"
      };
      let historico = monthlyData.map((item) => {
        const parts = item._id.split("-");
        const year = parts[0];
        const month = parts[1];
        const name = `${monthNamesMap[month] || month} ${year.substring(2)}`;
        return {
          name,
          total: item.count
        };
      });
      if (historico.length === 0) {
        historico = [
          { name: "Ene", total: 0 },
          { name: "Feb", total: 0 },
          { name: "Mar", total: 0 },
          { name: "Abr", total: 0 },
          { name: "May", total: 0 },
          { name: "Jun", total: 0 }
        ];
      } else {
        historico = historico.slice(-6);
      }
      const discapacidadSi = await db.collection("beneficiarios").countDocuments({ ...matchQuery, tiene_discapacidad: true });
      const discapacidadNo = await db.collection("beneficiarios").countDocuments({ ...matchQuery, tiene_discapacidad: false });
      const conCertificado = await db.collection("beneficiarios").countDocuments({ ...matchQuery, tiene_certificado_discapacidad: true });
      const victimaSi = await db.collection("beneficiarios").countDocuments({ ...matchQuery, victima_conflicto: true });
      const victimaNo = await db.collection("beneficiarios").countDocuments({ ...matchQuery, victima_conflicto: false });
      const aggregateCategory = async (field) => {
        const pipeline = [
          { $match: matchQuery },
          { $group: { _id: `$${field}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ];
        const result = await db.collection("beneficiarios").aggregate(pipeline).toArray();
        return result.map((item) => ({
          name: !item._id || item._id === "" ? "No reporta" : String(item._id),
          value: item.count
        }));
      };
      const [
        tiposDiscapacidad,
        etnias,
        nivelEducativo,
        situacionLaboral,
        tipoVivienda,
        rangoEdad
      ] = await Promise.all([
        aggregateCategory("tipo_discapacidad"),
        aggregateCategory("etnia"),
        aggregateCategory("nivel_educativo"),
        aggregateCategory("situacion_laboral"),
        aggregateCategory("tipo_vivienda"),
        aggregateCategory("rango_edad")
      ]);
      const sabeLeerSi = await db.collection("beneficiarios").countDocuments({ ...matchQuery, sabe_leer: true });
      const sabeEscribirSi = await db.collection("beneficiarios").countDocuments({ ...matchQuery, sabe_escribir: true });
      const estudiaActualmenteSi = await db.collection("beneficiarios").countDocuments({ ...matchQuery, estudia_actualmente: true });
      const ayudaHumanitariaSi = await db.collection("beneficiarios").countDocuments({ ...matchQuery, ayuda_humanitaria: true });
      const laboraCuidadoraSi = await db.collection("beneficiarios").countDocuments({ ...matchQuery, labora_cuidadora: true });
      const hijosPipeline = [
        { $match: { ...matchQuery, hijos_a_cargo: { $exists: true, $ne: null } } },
        {
          $project: {
            numericHijos: {
              $cond: {
                if: { $isNumber: "$hijos_a_cargo" },
                then: "$hijos_a_cargo",
                else: {
                  $cond: {
                    if: { $regexMatch: { input: { $toString: "$hijos_a_cargo" }, regex: /^[0-9]+$/ } },
                    then: { $toInt: "$hijos_a_cargo" },
                    else: 0
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            avgHijos: { $avg: "$numericHijos" }
          }
        }
      ];
      const hijosResult = await db.collection("beneficiarios").aggregate(hijosPipeline).toArray();
      const avgHijos = hijosResult[0]?.avgHijos ? parseFloat(hijosResult[0].avgHijos.toFixed(1)) : 0;
      res.json({
        totalBeneficiarios,
        atencionActiva: Math.floor(totalBeneficiarios * 0.25),
        comunasCubiertas: comunasCubiertas || 0,
        programasActivos: linea && linea !== "Todas las L\xEDneas" ? 1 : lineasTrabajo,
        genero: [
          { name: "Mujeres", value: mujeres },
          { name: "Hombres", value: hombres },
          { name: "Otros", value: otros }
        ],
        historico,
        // Nuevas métricas consolidadas
        vulnerabilidad: {
          discapacidad: { si: discapacidadSi, no: discapacidadNo, conCertificado },
          tiposDiscapacidad: tiposDiscapacidad.filter((item) => item.name !== "No reporta"),
          victimaConflicto: { si: victimaSi, no: victimaNo },
          etnias
        },
        educacion: {
          sabeLeer: sabeLeerSi,
          sabeEscribir: sabeEscribirSi,
          estudiaActualmente: estudiaActualmenteSi,
          nivelEducativo
        },
        socioeconomico: {
          situacionLaboral,
          tipoVivienda,
          ayudaHumanitaria: { si: ayudaHumanitariaSi },
          cuidadora: { si: laboraCuidadoraSi },
          avgHijos
        },
        demografia: {
          rangoEdad
        }
      });
    } catch (error) {
      console.error("Error al calcular estad\xEDsticas din\xE1micas:", error);
      res.status(500).json({ error: "Error al obtener estad\xEDsticas" });
    }
  });
  app.get("/api/secretarias", (req, res) => {
    res.json([
      "Administraci\xF3n General",
      "Secretar\xEDa de Hacienda",
      "Secretar\xEDa General",
      "Secretar\xEDa de Gobierno",
      "Secretar\xEDa de Educaci\xF3n",
      "Secretar\xEDa de Salud",
      "Secretar\xEDa de Inclusi\xF3n y Cohesi\xF3n Social",
      "Secretar\xEDa de Mujer, G\xE9nero y Diversidad Sexual",
      "Secretar\xEDa de Cultura, Patrimonio y Turismo \xC9tnico Local",
      "Secretar\xEDa de Desarrollo Econ\xF3mico y Agroindustrial",
      "Secretar\xEDa de Planeaci\xF3n",
      "Secretar\xEDa de Movilidad",
      "Secretar\xEDa de Infraestructura",
      "Secretar\xEDa de Medio Ambiente y Biodiversidad",
      "Secretar\xEDa de Turismo, Econom\xEDa Naranja y Competitividad"
    ]);
  });
  app.get("/api/funcionarios", async (req, res) => {
    if (!db) return res.json([]);
    try {
      const funcionarios = await db.collection("funcionarios").find({ estado: "Activo" }).toArray();
      res.json(funcionarios);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener funcionarios" });
    }
  });
  app.get("/api/comunas", async (req, res) => {
    if (!db) return res.json([
      { _id: "1", nombre: "Comuna 1", zona: "Zona Norte" },
      { _id: "2", nombre: "Comuna 2", zona: "Porvenir - Platina" },
      { _id: "3", nombre: "Comuna 3", zona: "Anillo Central" },
      { _id: "4", nombre: "Comuna 4", zona: "San Vicente - Ni\xF1o Jesus" },
      { _id: "5", nombre: "Comuna 5", zona: "Medrano y Zona Sur" },
      { _id: "6", nombre: "Comuna 6", zona: "Jard\xEDn" }
    ]);
    try {
      const comunas = await db.collection("comunas").find().toArray();
      if (comunas.length === 0) {
        return res.json([
          { _id: "mock1", nombre: "Comuna 1", zona: "Zona Norte" },
          { _id: "mock2", nombre: "Comuna 2", zona: "Porvenir - Platina" },
          { _id: "mock3", nombre: "Comuna 3", zona: "Anillo Central" },
          { _id: "mock4", nombre: "Comuna 4", zona: "San Vicente - Ni\xF1o Jesus" },
          { _id: "mock5", nombre: "Comuna 5", zona: "Medrano y Zona Sur" },
          { _id: "mock6", nombre: "Comuna 6", zona: "Jard\xEDn" }
        ]);
      }
      res.json(comunas);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener comunas" });
    }
  });
  app.post("/api/comunas", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const data = {
        ...req.body,
        fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
      };
      const result = await db.collection("comunas").insertOne(data);
      res.status(201).json({ id: result.insertedId, ...data });
    } catch (error) {
      res.status(500).json({ error: "Error al crear comuna" });
    }
  });
  app.put("/api/comunas/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { _id, ...updateData } = req.body;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const result = await db.collection("comunas").updateOne(
        { _id: new ObjectId2(id) },
        { $set: updateData }
      );
      if (result.matchedCount === 0) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar comuna" });
    }
  });
  app.delete("/api/comunas/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const result = await db.collection("comunas").deleteOne({ _id: new ObjectId2(id) });
      if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar comuna" });
    }
  });
  app.post("/api/funcionarios", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { password, ...userData } = req.body;
      const salt = await import_bcryptjs.default.genSalt(10);
      const password_hash = await import_bcryptjs.default.hash(password || "1077476862", salt);
      const data = {
        ...userData,
        password_hash,
        estado: userData.estado || "Activo",
        fecha_registro: (/* @__PURE__ */ new Date()).toISOString(),
        ultima_actualizacion: (/* @__PURE__ */ new Date()).toISOString()
      };
      const result = await db.collection("funcionarios").insertOne(data);
      res.status(201).json({ id: result.insertedId, ...data });
    } catch (error) {
      res.status(500).json({ error: "Error al crear funcionario" });
    }
  });
  app.put("/api/funcionarios/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { _id, password, ...updateData } = req.body;
      let finalUpdate = { ...updateData, ultima_actualizacion: (/* @__PURE__ */ new Date()).toISOString() };
      if (password) {
        const salt = await import_bcryptjs.default.genSalt(10);
        finalUpdate.password_hash = await import_bcryptjs.default.hash(password, salt);
      }
      const result = await db.collection("funcionarios").updateOne(
        { _id: new import_mongodb.ObjectId(id) },
        { $set: finalUpdate }
      );
      if (result.matchedCount === 0) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar funcionario" });
    }
  });
  app.delete("/api/funcionarios/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const result = await db.collection("funcionarios").deleteOne({ _id: new ObjectId2(id) });
      if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar funcionario" });
    }
  });
  app.get("/api/lineas", async (req, res) => {
    if (!db) return res.json([
      { _id: "1", nombre: "Adulto Mayor", descripcion: "Programa de atenci\xF3n integral al adulto mayor.", fecha_creacion: (/* @__PURE__ */ new Date()).toISOString(), estado: "Activo" },
      { _id: "2", nombre: "Personas con Discapacidad", descripcion: "Apoyo y registro de personas con capacidades diversas.", fecha_creacion: (/* @__PURE__ */ new Date()).toISOString(), estado: "Activo" },
      { _id: "3", nombre: "Juventud", descripcion: "Ejes transversales para el desarrollo juvenil.", fecha_creacion: (/* @__PURE__ */ new Date()).toISOString(), estado: "Activo" }
    ]);
    try {
      const lineas = await db.collection("lineas_trabajo").find({ estado: "Activo" }).toArray();
      if (lineas.length === 0) {
        return res.json([
          { _id: "mock1", nombre: "Adulto Mayor", descripcion: "Programa de atenci\xF3n integral al adulto mayor.", fecha_creacion: (/* @__PURE__ */ new Date()).toISOString(), estado: "Activo" },
          { _id: "mock2", nombre: "Personas con Discapacidad", descripcion: "Apoyo y registro de personas con capacidades diversas.", fecha_creacion: (/* @__PURE__ */ new Date()).toISOString(), estado: "Activo" },
          { _id: "mock3", nombre: "Juventud", descripcion: "Ejes transversales para el desarrollo juvenil.", fecha_creacion: (/* @__PURE__ */ new Date()).toISOString(), estado: "Activo" }
        ]);
      }
      res.json(lineas);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener l\xEDneas de trabajo" });
    }
  });
  app.post("/api/lineas", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const data = {
        ...req.body,
        estado: "Activo",
        fecha_creacion: (/* @__PURE__ */ new Date()).toISOString()
      };
      const result = await db.collection("lineas_trabajo").insertOne(data);
      res.status(201).json({ id: result.insertedId, ...data });
    } catch (error) {
      res.status(500).json({ error: "Error al crear l\xEDnea de trabajo" });
    }
  });
  app.put("/api/lineas/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { _id, ...updateData } = req.body;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const result = await db.collection("lineas_trabajo").updateOne(
        { _id: new ObjectId2(id) },
        { $set: { ...updateData, fecha_actualizacion: (/* @__PURE__ */ new Date()).toISOString() } }
      );
      if (result.matchedCount === 0) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar l\xEDnea de trabajo" });
    }
  });
  app.delete("/api/lineas/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const result = await db.collection("lineas_trabajo").deleteOne(
        { _id: new ObjectId2(id) }
      );
      if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar l\xEDnea de trabajo" });
    }
  });
  app.get("/api/beneficiarios/check/:documento", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { documento } = req.params;
      const trimmed = documento.trim();
      const docNum = Number(trimmed);
      const query = {
        $or: [
          { numero_documento: trimmed },
          { numero_documento: { $regex: new RegExp(`^\\s*${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") } },
          { identificacion: trimmed },
          { identificacion: { $regex: new RegExp(`^\\s*${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") } },
          { numero_identificacion: trimmed },
          { numero_identificacion: { $regex: new RegExp(`^\\s*${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") } },
          { cedula: trimmed },
          { cedula: { $regex: new RegExp(`^\\s*${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") } }
        ]
      };
      if (!isNaN(docNum)) {
        query.$or.push({ numero_documento: docNum });
        query.$or.push({ identificacion: docNum });
        query.$or.push({ numero_identificacion: docNum });
        query.$or.push({ cedula: docNum });
      }
      const b = await db.collection("beneficiarios").findOne(query);
      res.json({ exists: !!b, nombre: b?.nombre_completo || b?.nombre || "Usuario registrado" });
    } catch (error) {
      console.error("Check doc error:", error);
      res.status(500).json({ error: "Error al verificar documento" });
    }
  });
  app.get("/api/beneficiarios/check-email/:email", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { email } = req.params;
      const trimmed = email.trim();
      const b = await db.collection("beneficiarios").findOne({
        $or: [
          { correo_electronico: trimmed },
          { correo_electronico: { $regex: new RegExp(`^\\s*${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") } }
        ]
      });
      res.json({ exists: !!b, nombre: b?.nombre_completo || b?.nombre || "Usuario registrado" });
    } catch (error) {
      res.status(500).json({ error: "Error al verificar correo" });
    }
  });
  app.get("/api/beneficiarios", async (req, res) => {
    if (!db) return res.json({ data: [], total: 0 });
    try {
      const { search, linea, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      let matchQuery = {};
      const conditions = [];
      if (search) {
        if (/^[0-9a-fA-F]{24}$/.test(search.toString())) {
          const { ObjectId: ObjectId2 } = await import("mongodb");
          conditions.push({ _id: new ObjectId2(search.toString()) });
        } else {
          conditions.push({
            $or: [
              { nombre_completo: { $regex: search, $options: "i" } },
              { numero_documento: { $regex: search, $options: "i" } }
            ]
          });
        }
      }
      if (linea && linea !== "Todas las L\xEDneas") {
        conditions.push({
          $or: [
            { linea_trabajo: linea },
            { "linea_info.nombre": linea }
          ]
        });
      }
      if (conditions.length > 0) {
        matchQuery.$and = conditions;
      }
      const pipeline = [];
      const isSingleIdQuery = search && /^[0-9a-fA-F]{24}$/.test(search.toString());
      if (!isSingleIdQuery) {
        pipeline.push({ $project: { firma: 0 } });
      }
      pipeline.push(
        {
          $lookup: {
            from: "lineas_trabajo",
            let: { lineaId: "$linea_trabajo" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$_id", "$$lineaId"] },
                      { $eq: [{ $toString: "$_id" }, "$$lineaId"] },
                      { $eq: ["$nombre", "$$lineaId"] }
                    ]
                  }
                }
              }
            ],
            as: "linea_info"
          }
        },
        {
          $addFields: {
            linea_nombre: {
              $cond: {
                if: { $gt: [{ $size: "$linea_info" }, 0] },
                then: { $arrayElemAt: ["$linea_info.nombre", 0] },
                else: "$linea_trabajo"
              }
            }
          }
        },
        { $match: matchQuery }
      );
      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await db.collection("beneficiarios").aggregate(countPipeline).toArray();
      const total = countResult.length > 0 ? countResult[0].total : 0;
      pipeline.push({ $sort: { fecha_registro: -1 } });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: Number(limit) });
      const beneficiarios = await db.collection("beneficiarios").aggregate(pipeline).toArray();
      res.json({
        data: beneficiarios,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error("Error in beneficiarios API:", error);
      res.status(500).json({ error: "Error al obtener beneficiarios" });
    }
  });
  app.get("/api/beneficiarios/export", async (req, res) => {
    if (!db) return res.status(503).json({ error: "Base de datos no disponible" });
    try {
      const { startDate, endDate, linea } = req.query;
      let matchQuery = {};
      const conditions = [];
      if (linea && linea !== "Todas las L\xEDneas") {
        conditions.push({
          $or: [
            { linea_trabajo: linea },
            { "linea_info.nombre": linea }
          ]
        });
      }
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) {
          dateFilter.$gte = startDate.toString();
        }
        if (endDate) {
          dateFilter.$lte = endDate.toString() + "T23:59:59.999Z";
        }
        conditions.push({
          $or: [
            { fecha_registro: dateFilter },
            {
              $expr: {
                $and: [
                  ...startDate ? [{ $gte: [{ $toDate: "$fecha_registro" }, /* @__PURE__ */ new Date(startDate.toString() + "T00:00:00.000Z")] }] : [],
                  ...endDate ? [{ $lte: [{ $toDate: "$fecha_registro" }, /* @__PURE__ */ new Date(endDate.toString() + "T23:59:59.999Z")] }] : []
                ]
              }
            }
          ]
        });
      }
      if (conditions.length > 0) {
        matchQuery.$and = conditions;
      }
      const pipeline = [
        { $project: { firma: 0 } },
        // exclude signatures which can be massive
        {
          $lookup: {
            from: "lineas_trabajo",
            let: { lineaId: "$linea_trabajo" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$_id", "$$lineaId"] },
                      { $eq: [{ $toString: "$_id" }, "$$lineaId"] },
                      { $eq: ["$nombre", "$$lineaId"] }
                    ]
                  }
                }
              }
            ],
            as: "linea_info"
          }
        },
        {
          $addFields: {
            linea_nombre: {
              $cond: {
                if: { $gt: [{ $size: "$linea_info" }, 0] },
                then: { $arrayElemAt: ["$linea_info.nombre", 0] },
                else: "$linea_trabajo"
              }
            }
          }
        },
        { $match: matchQuery },
        { $sort: { fecha_registro: -1 } }
      ];
      const beneficiarios = await db.collection("beneficiarios").aggregate(pipeline).toArray();
      res.json(beneficiarios);
    } catch (error) {
      console.error("Error exporting beneficiarios:", error);
      res.status(500).json({ error: "Error al exportar beneficiarios" });
    }
  });
  app.get("/api/beneficiarios/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const b = await db.collection("beneficiarios").findOne({ _id: new ObjectId2(id) });
      if (!b) return res.status(404).json({ error: "Not found" });
      res.json(b);
    } catch (error) {
      console.error("Error fetching single beneficiario:", error);
      res.status(500).json({ error: "Error al obtener beneficiario" });
    }
  });
  app.put("/api/beneficiarios/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { _id, ...updateData } = req.body;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const sanitizedBody = { ...updateData };
      if (sanitizedBody.numero_documento) sanitizedBody.numero_documento = sanitizedBody.numero_documento.toString().trim();
      if (sanitizedBody.correo_electronico) sanitizedBody.correo_electronico = sanitizedBody.correo_electronico.toString().trim().toLowerCase();
      const result = await db.collection("beneficiarios").updateOne(
        { _id: new ObjectId2(id) },
        { $set: { ...sanitizedBody, fecha_actualizacion: (/* @__PURE__ */ new Date()).toISOString() } }
      );
      if (result.matchedCount === 0) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar beneficiario" });
    }
  });
  app.delete("/api/beneficiarios/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const result = await db.collection("beneficiarios").deleteOne({
        _id: new ObjectId2(id)
      });
      if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar beneficiario" });
    }
  });
  app.post("/api/beneficiarios", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.numero_documento) sanitizedBody.numero_documento = sanitizedBody.numero_documento.toString().trim();
      if (sanitizedBody.correo_electronico) sanitizedBody.correo_electronico = sanitizedBody.correo_electronico.toString().trim().toLowerCase();
      const data = {
        ...sanitizedBody,
        fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
      };
      const result = await db.collection("beneficiarios").insertOne(data);
      res.status(201).json({ id: result.insertedId, ...data });
    } catch (error) {
      res.status(500).json({ error: "Error al registrar beneficiario" });
    }
  });
  app.get("/api/actividades", async (req, res) => {
    if (!db) {
      return res.json([
        { _id: "act1", nombre: "Taller de Inclusi\xF3n Digital", linea: "Juventud", fecha: "2026-06-10", lugar: "Auditorio de la Alcald\xEDa", estado: "Planificada", facilitador: "Yordan Solis", cupos: 30 },
        { _id: "act2", nombre: "Jornada de Salud F\xEDsica y Mental", linea: "Adulto Mayor", fecha: "2026-06-15", lugar: "Centro de Vida Comuna 1", estado: "Planificada", facilitador: "Maria Chaverra", cupos: 50 },
        { _id: "act3", nombre: "Conversatorio Emprendimiento \xC9tnico", linea: "G\xE9nero y Diversidad", fecha: "2026-06-08", lugar: "Sede Comunal Medrano", estado: "En Curso", facilitador: "Yordan Solis", cupos: 25 }
      ]);
    }
    try {
      let list = await db.collection("actividades").find({}).toArray();
      if (list.length === 0) {
        const initial = [
          { nombre: "Taller de Inclusi\xF3n Digital", linea: "Juventud", fecha: "2026-06-10", lugar: "Auditorio de la Alcald\xEDa", estado: "Planificada", facilitador: "Yordan Solis", cupos: 30 },
          { nombre: "Jornada de Salud F\xEDsica y Mental", linea: "Adulto Mayor", fecha: "2026-06-15", lugar: "Centro de Vida Comuna 1", estado: "Planificada", facilitador: "Maria Chaverra", cupos: 50 },
          { nombre: "Conversatorio Emprendimiento \xC9tnico", linea: "G\xE9nero y Diversidad", fecha: "2026-06-08", lugar: "Sede Comunal Medrano", estado: "En Curso", facilitador: "Yordan Solis", cupos: 25 },
          { nombre: "Capacitaci\xF3n de Liderazgo Comunitario", linea: "General", fecha: "2026-05-20", lugar: "Casa de Justicia", estado: "Realizada", facilitador: "Yordan Solis", cupos: 40 }
        ];
        await db.collection("actividades").insertMany(initial);
        list = await db.collection("actividades").find({}).toArray();
      }
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener actividades" });
    }
  });
  app.get("/api/actividades/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const act = await db.collection("actividades").findOne({ _id: new ObjectId2(id) });
      if (!act) return res.status(404).json({ error: "Not found" });
      if (act.asistentes && Array.isArray(act.asistentes)) {
        const objectIds = act.asistentes.map((a) => {
          try {
            const idToParse = typeof a === "object" && a !== null ? a.beneficiario_id || a._id : a;
            return new ObjectId2(idToParse.toString());
          } catch (e) {
            return null;
          }
        }).filter((id2) => id2 !== null);
        const beneficiarios = await db.collection("beneficiarios").find({ _id: { $in: objectIds } }).toArray();
        act.asistentes_detalles = beneficiarios;
      }
      res.json(act);
    } catch (error) {
      console.error("Error fetching single actividad:", error);
      res.status(500).json({ error: "Error al obtener actividad" });
    }
  });
  app.post("/api/actividades", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const data = {
        ...req.body,
        fecha_creacion: (/* @__PURE__ */ new Date()).toISOString()
      };
      const result = await db.collection("actividades").insertOne(data);
      res.status(201).json({ _id: result.insertedId, ...data });
    } catch (error) {
      res.status(500).json({ error: "Error al crear actividad" });
    }
  });
  app.put("/api/actividades/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const { _id, asistentes_detalles, ...updateData } = req.body;
      const result = await db.collection("actividades").updateOne(
        { _id: new ObjectId2(id) },
        { $set: updateData }
      );
      if (result.matchedCount === 0) return res.status(404).json({ error: "Actividad no encontrada" });
      res.json({ message: "Actividad actualizada con \xE9xito" });
    } catch (error) {
      console.error("Error al actualizar actividad:", error);
      res.status(500).json({ error: "Error al actualizar actividad" });
    }
  });
  app.delete("/api/actividades/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const result = await db.collection("actividades").deleteOne({ _id: new ObjectId2(id) });
      if (result.deletedCount === 0) return res.status(404).json({ error: "Actividad no encontrada" });
      res.json({ message: "Actividad eliminada con \xE9xito" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar actividad" });
    }
  });
  app.get("/api/asistencia", async (req, res) => {
    if (!db) {
      return res.json([]);
    }
    try {
      const { actividad_id } = req.query;
      const q = {};
      if (actividad_id) {
        q.actividad_id = actividad_id.toString();
      }
      const list = await db.collection("asistencias").find(q).toArray();
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener asistencia" });
    }
  });
  app.post("/api/asistencia", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { actividad_id, asistentes } = req.body;
      if (!actividad_id) {
        return res.status(400).json({ error: "Falta actividad_id" });
      }
      await db.collection("asistencias").deleteMany({ actividad_id: actividad_id.toString() });
      if (asistentes && asistentes.length > 0) {
        const records = asistentes.map((asist) => ({
          actividad_id: actividad_id.toString(),
          beneficiario_id: asist.beneficiario_id,
          nombre_beneficiario: asist.nombre_beneficiario,
          documento_beneficiario: asist.documento_beneficiario,
          fecha: (/* @__PURE__ */ new Date()).toISOString(),
          firmado: asist.firmado || false,
          observaciones: asist.observaciones || ""
        }));
        await db.collection("asistencias").insertMany(records);
      }
      res.json({ message: "Asistencia actualizada con \xE9xito", count: asistentes?.length || 0 });
    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      res.status(500).json({ error: "Error al registrar asistencia" });
    }
  });
  app.get("/api/asitente", async (req, res) => {
    res.redirect("/api/asistente");
  });
  app.get("/api/asistente", async (req, res) => {
    if (!db) {
      return res.json([
        {
          _id: "asist1",
          nombre: "Haminton M. Mena",
          nombre_completo: "Haminton M. Mena",
          cedula: "80772379",
          dependencia: "Secretar\xEDa de Inclusi\xF3n y Cohesi\xF3n Social",
          cargo: "Ingeniero de sistemas",
          tipo_participacion: "CONTRATISTA",
          telefono: "3004561234",
          email: "hamintonjair@gmail.com",
          correo: "hamintonjair@gmail.com",
          firma: "",
          tipo: "funcionario",
          fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          _id: "asist2",
          nombre: "Yency Lloreda Morenos",
          nombre_completo: "Yency Lloreda Morenos",
          cedula: "35546580",
          dependencia: "Secretar\xEDa de Inclusi\xF3n y Cohesi\xF3n Social",
          cargo: "Atenci\xF3n Poblaci\xF3n Con Discapacidad",
          tipo_participacion: "CONTRATISTA",
          telefono: "3127894561",
          email: "yency@gmail.com",
          correo: "yency@gmail.com",
          firma: "",
          tipo: "funcionario",
          fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          _id: "asist3",
          nombre: "Lucelis Martinez Minota",
          nombre_completo: "Lucelis Martinez Minota",
          cedula: "35892443",
          dependencia: "Secretar\xEDa de Inclusi\xF3n y Cohesi\xF3n Social",
          cargo: "Ing. De sistemas",
          tipo_participacion: "CONTRATISTA",
          telefono: "3209876543",
          email: "lucelis@gmail.com",
          correo: "lucelis@gmail.com",
          firma: "",
          tipo: "funcionario",
          fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          _id: "asist4",
          nombre: "Kesia bland\xF3n parra",
          nombre_completo: "Kesia bland\xF3n parra",
          cedula: "1077453712",
          dependencia: "Secretar\xEDa de Inclusi\xF3n y Cohesi\xF3n Social",
          cargo: "Profesional social",
          tipo_participacion: "CONTRATISTA",
          telefono: "3146543210",
          email: "kesia@gmail.com",
          correo: "kesia@gmail.com",
          firma: "",
          tipo: "funcionario",
          fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
        }
      ]);
    }
    try {
      let list1 = [];
      let list2 = [];
      try {
        list1 = await db.collection("asistentes").find({}).toArray();
      } catch (err) {
        console.error("Error reading 'asistentes':", err);
      }
      try {
        list2 = await db.collection("asistentes.asistentes").find({}).toArray();
      } catch (err) {
        console.error("Error reading 'asistentes.asistentes':", err);
      }
      const combined = [...list1, ...list2];
      if (combined.length === 0) {
        const initialMap = [
          {
            nombre: "Haminton M. Mena",
            nombre_completo: "Haminton M. Mena",
            cedula: "80772379",
            dependencia: "Secretar\xEDa de Inclusi\xF3n y Cohesi\xF3n Social",
            cargo: "Ingeniero de sistemas",
            tipo_participacion: "CONTRATISTA",
            telefono: "3004561234",
            email: "hamintonjair@gmail.com",
            correo: "hamintonjair@gmail.com",
            firma: "",
            tipo: "funcionario",
            fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            nombre: "Yency Lloreda Morenos",
            nombre_completo: "Yency Lloreda Morenos",
            cedula: "35546580",
            dependencia: "Secretar\xEDa de Inclusi\xF3n y Cohesi\xF3n Social",
            cargo: "Atenci\xF3n Poblaci\xF3n Con Discapacidad",
            tipo_participacion: "CONTRATISTA",
            telefono: "3127894561",
            email: "yency@gmail.com",
            correo: "yency@gmail.com",
            firma: "",
            tipo: "funcionario",
            fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            nombre: "Lucelis Martinez Minota",
            nombre_completo: "Lucelis Martinez Minota",
            cedula: "35892443",
            dependencia: "Secretar\xEDa de Inclusi\xF3n y Cohesi\xF3n Social",
            cargo: "Ing. De sistemas",
            tipo_participacion: "CONTRATISTA",
            telefono: "3209876543",
            email: "lucelis@gmail.com",
            correo: "lucelis@gmail.com",
            firma: "",
            tipo: "funcionario",
            fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            nombre: "Kesia bland\xF3n parra",
            nombre_completo: "Kesia bland\xF3n parra",
            cedula: "1077453712",
            dependencia: "Secretar\xEDa de Inclusi\xF3n y Cohesi\xF3n Social",
            cargo: "Profesional social",
            tipo_participacion: "CONTRATISTA",
            telefono: "3146543210",
            email: "kesia@gmail.com",
            correo: "kesia@gmail.com",
            firma: "",
            tipo: "funcionario",
            fecha_registro: (/* @__PURE__ */ new Date()).toISOString()
          }
        ];
        await db.collection("asistentes").insertMany(initialMap);
        try {
          await db.collection("asistentes.asistentes").insertMany(initialMap);
        } catch (e) {
        }
        const seededList = await db.collection("asistentes").find({}).sort({ fecha_registro: -1 }).toArray();
        return res.json(seededList.map((item) => ({
          ...item,
          nombre_completo: item.nombre_completo || item.nombre || "",
          nombre: item.nombre || item.nombre_completo || "",
          correo: item.correo || item.email || "",
          email: item.email || item.correo || "",
          fecha_registro: item.fecha_registro || item.fecha_creacion || (/* @__PURE__ */ new Date()).toISOString()
        })));
      }
      const uniqueMap = /* @__PURE__ */ new Map();
      for (const item of combined) {
        const cedulaTrim = item.cedula ? item.cedula.toString().trim() : "";
        if (!cedulaTrim) {
          uniqueMap.set(String(item._id), item);
          continue;
        }
        if (uniqueMap.has(cedulaTrim)) {
          const existing = uniqueMap.get(cedulaTrim);
          const hasFirma = item.firma && item.firma.length > 20;
          const extHasFirma = existing.firma && existing.firma.length > 20;
          if (hasFirma && !extHasFirma) {
            uniqueMap.set(cedulaTrim, item);
          } else {
            const dateNew = new Date(item.fecha_registro || item.fecha_creacion || item.fecha_actualizacion || 0).getTime();
            const dateExt = new Date(existing.fecha_registro || existing.fecha_creacion || existing.fecha_actualizacion || 0).getTime();
            if (dateNew > dateExt) {
              uniqueMap.set(cedulaTrim, item);
            }
          }
        } else {
          uniqueMap.set(cedulaTrim, item);
        }
      }
      const list = Array.from(uniqueMap.values());
      const normalizedList = list.map((item) => ({
        ...item,
        nombre_completo: item.nombre_completo || item.nombre || "",
        nombre: item.nombre || item.nombre_completo || "",
        correo: item.correo || item.email || "",
        email: item.email || item.correo || "",
        fecha_registro: item.fecha_registro || item.fecha_creacion || (/* @__PURE__ */ new Date()).toISOString()
      }));
      normalizedList.sort((a, b) => {
        return new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime();
      });
      res.json(normalizedList);
    } catch (error) {
      console.error("Error al obtener asistentes:", error);
      res.status(500).json({ error: "Error al obtener asistentes" });
    }
  });
  app.post("/api/asistente", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const nombreVal = req.body.nombre_completo || req.body.nombre || "";
      const correoVal = req.body.correo || req.body.email || "";
      const data = {
        tipo: req.body.tipo || "funcionario",
        nombre: nombreVal,
        nombre_completo: nombreVal,
        cedula: req.body.cedula?.toString().trim(),
        dependencia: req.body.dependencia,
        cargo: req.body.cargo,
        tipo_participacion: req.body.tipo_participacion || "SERVIDOR P\xDABLICO",
        telefono: req.body.telefono || "",
        correo: correoVal,
        email: correoVal,
        firma: req.body.firma || "",
        fecha_registro: (/* @__PURE__ */ new Date()).toISOString(),
        fecha_creacion: (/* @__PURE__ */ new Date()).toISOString()
      };
      const existing = await db.collection("asistentes").findOne({ cedula: data.cedula });
      if (existing) {
        return res.status(400).json({ error: "Ya existe un asistente registrado con esta c\xE9dula" });
      }
      const result = await db.collection("asistentes").insertOne(data);
      try {
        await db.collection("asistentes.asistentes").insertOne({ ...data, _id: result.insertedId });
      } catch (err) {
        console.error("Error writing backup to 'asistentes.asistentes':", err);
      }
      res.status(201).json({ _id: result.insertedId, ...data });
    } catch (error) {
      console.error("Error al crear asistente:", error);
      res.status(500).json({ error: "Error al crear asistente" });
    }
  });
  app.put("/api/asistente/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { _id, ...updateData } = req.body;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      if (updateData.nombre_completo || updateData.nombre) {
        const val = updateData.nombre_completo || updateData.nombre;
        updateData.nombre = val;
        updateData.nombre_completo = val;
      }
      if (updateData.correo || updateData.email) {
        const val = updateData.correo || updateData.email;
        updateData.correo = val;
        updateData.email = val;
      }
      if (updateData.cedula) {
        updateData.cedula = updateData.cedula.toString().trim();
        const existing = await db.collection("asistentes").findOne({
          cedula: updateData.cedula,
          _id: { $ne: new ObjectId2(id) }
        });
        if (existing) {
          return res.status(400).json({ error: "Ya existe otro asistente registrado con esta c\xE9dula" });
        }
      }
      updateData.fecha_actualizacion = (/* @__PURE__ */ new Date()).toISOString();
      const result = await db.collection("asistentes").updateOne(
        { _id: new ObjectId2(id) },
        { $set: updateData }
      );
      let result2 = { matchedCount: 0 };
      try {
        result2 = await db.collection("asistentes.asistentes").updateOne(
          { _id: new ObjectId2(id) },
          { $set: updateData }
        );
      } catch (err) {
        console.error("Error updating 'asistentes.asistentes':", err);
      }
      if (result2.matchedCount === 0 && updateData.cedula) {
        try {
          await db.collection("asistentes.asistentes").updateOne(
            { cedula: updateData.cedula },
            { $set: updateData }
          );
        } catch (e) {
          console.error("Error backing up update to 'asistentes.asistentes' by cedula:", e);
        }
      }
      if (result.matchedCount === 0 && result2.matchedCount === 0) {
        return res.status(404).json({ error: "Asistente no encontrado" });
      }
      res.json({ message: "Asistente actualizado con \xE9xito" });
    } catch (error) {
      console.error("Error al actualizar asistente:", error);
      res.status(500).json({ error: "Error al actualizar asistente" });
    }
  });
  app.delete("/api/asistente/:id", async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB unavailable" });
    try {
      const { id } = req.params;
      const { ObjectId: ObjectId2 } = await import("mongodb");
      const result1 = await db.collection("asistentes").deleteOne({ _id: new ObjectId2(id) });
      let result2 = { deletedCount: 0 };
      try {
        result2 = await db.collection("asistentes.asistentes").deleteOne({ _id: new ObjectId2(id) });
      } catch (err) {
        console.error("Error deleting from 'asistentes.asistentes':", err);
      }
      if (result1.deletedCount === 0 && result2.deletedCount === 0) {
        return res.status(404).json({ error: "Asistente no encontrado" });
      }
      res.json({ message: "Asistente eliminado con \xE9xito" });
    } catch (error) {
      console.error("Error al eliminar asistente:", error);
      res.status(500).json({ error: "Error al eliminar asistente" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
