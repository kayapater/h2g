export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Geçerli bir e-posta girin' }, { status: 400 });
    }

    const firebaseUrl = `https://${env.FIREBASE_PROJECT_ID}-default-rtdb.${env.FIREBASE_REGION}.firebasedatabase.app/subscribers.json`;
    await fetch(firebaseUrl, {
      method: 'POST',
      body: JSON.stringify({ email, createdAt: new Date().toISOString() }),
    });

    const html = `<div style="background:#020617;color:#F8FAFC;padding:40px;font-family:system-ui;text-align:center">
      <h1 style="font-size:32px;font-weight:900;font-style:italic;background:linear-gradient(135deg,#60A5FA,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent">H2G</h1>
      <p style="color:#94A3B8;font-size:16px;margin:20px 0">Bültene kaydoldun! Tarayıcı eklentimiz yayına girdiğinde ilk sen haberdar olacaksın.</p>
      <p style="color:#64748B;font-size:12px">YouTube, Netflix, Prime Video ve daha fazlasında arkadaşlarınla eşzamanlı izle.</p>
      <a href="https://h2g.kayapater.dev" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#3B82F6;color:#fff;border-radius:12px;text-decoration:none;font-weight:700">H2G'yi Dene</a>
    </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `H2G <h2g@${env.DOMAIN}>`,
        to: [email],
        subject: 'H2G haber bültenine kaydoldun! 🎬',
        html,
      }),
    });

    const body = await res.text();
    console.log('Email send:', res.status, body);

    if (res.ok) {
      return Response.json({ success: true, message: 'Kaydoldun! Onay maili gönderildi.' });
    }
    return Response.json({ error: 'Mail gönderilemedi' }, { status: 502 });
  } catch (e) {
    return Response.json({ error: 'Bir hata oluştu, tekrar dene.' }, { status: 500 });
  }
}
