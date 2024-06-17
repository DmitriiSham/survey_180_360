document.addEventListener("DOMContentLoaded", () => {
    const origin = window.location.origin;
    const authUrl = `${origin}/api/signIn`;
    const appUrl = `${origin}/app/${params.appId}/${params.path}`;
    const redirectUrl = `${authUrl}?callbackUrl=${encodeURIComponent(appUrl)}`;
    window.location.href = redirectUrl;
});