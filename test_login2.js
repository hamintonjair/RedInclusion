(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'yordansolis2@gmail.com', password: 'unknown' })
        });
        const text = await res.text();
        console.log(res.status, text);
    } catch(e) {
        console.error(e);
    }
})();
