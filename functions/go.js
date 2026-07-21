export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const room = url.searchParams.get('r');
  const video = url.searchParams.get('v');

  if (!room || room.length < 3) {
    return new Response('Geçersiz oda kodu. H2G eklentisi ile tekrar deneyin.', { 
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  }

  let targetUrl;
  if (video) {
    const decodedVideo = decodeURIComponent(video);
    const separator = decodedVideo.includes('#') ? '&' : '#';
    targetUrl = `${decodedVideo}${separator}h2g=${room}`;
  } else {
    targetUrl = `https://h2g.kayapater.dev/#h2g=${room}`;
  }

  return Response.redirect(targetUrl, 302);
}
