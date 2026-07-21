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

    const mailPayload = {
      personalizations: [{ to: [{ email }] }],
      from: { email: `h2g@${env.DOMAIN}`, name: 'H2G' },
      subject: 'H2G haber bültenine kaydoldun! 🎬',
      content: [{
        type: 'text/html',
        value: `<div style="background:#020617;color:#F8FAFC;padding:40px;font-family:system-ui;text-align:center">
          <h1 style="font-size:32px;font-weight:900;font-style:italic;background:linear-gradient(135deg,#60A5FA,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent">H2G</h1>
          <p style="color:#94A3B8;font-size:16px;margin:20px 0">Bültene kaydoldun! Tarayıcı eklentimiz yayına girdiğinde ilk sen haberdar olacaksın.</p>
          <p style="color:#64748B;font-size:12px">YouTube, Netflix, Prime Video ve daha fazlasında arkadaşlarınla eşzamanlı izle.</p>
          <a href="https://h2g.kayapater.dev" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#3B82F6;color:#fff;border-radius:12px;text-decoration:none;font-weight:700">H2G'yi Dene</a>
        </div>`
      }]
    };

    const mcResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mailPayload),
    });

    const mcBody = await mcResponse.text();
    console.log('MailChannels response:', mcResponse.status, mcBody);

    if (mcResponse.status === 202) {
      return Response.json({ success: true, message: 'Kaydoldun! Onay maili gönderildi.' });
    } else {
      return Response.json({ error: 'Mail gönderilemedi: ' + mcBody }, { status: 502 });
    }
  } catch (e) {
    return Response.json({ error: 'Bir hata oluştu, tekrar dene.' }, { status: 500 });
  }
}
