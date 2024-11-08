
console.log("LOAD")

// Set basic variables
const appClientId = "e61711cbd130408abf2d471288b77e87";
const redirectUri = 'http://localhost:5173/callback'; // IMPORTANT: IT HAS TO BE A REDIRECT URI ON THE APP SETTINGS ONLINE

////// THE PROCESS WAS ABOUT CHECKING THE CODE BUT IT OUTDATES RIGHT AWAY NO USING DIRECTLY ACCESS TOKEN //////
// const params = new URLSearchParams(window.location.search);
// const userCode = params.get("code");
const accessToken = localStorage.getItem("access_token");
var postAuthorization = localStorage.getItem("post_authorization")
console.log("postAuthorization: " + postAuthorization)
console.log("accessToken: " + accessToken)

///// NORMAL CODE TO RUN - Fails because the code is not right, need to refresh everytime /////
if ((!accessToken || accessToken === 'undefined') && (!postAuthorization || postAuthorization === 'no')) {
    console.log("Auth flow");
    localStorage.setItem('post_authorization', 'yes')
    redirectToAuthCodeFlow(appClientId);
} else if (postAuthorization === 'yes') {
    console.log("Post Auth flow");
    const params = new URLSearchParams(window.location.search);
    const userCode = params.get("code");
    const accessToken = await getAccessToken(appClientId, userCode);
    localStorage.setItem('access_token', accessToken); // Store the access token
    console.log("accessToken is saved to "+accessToken)
    let postAuthorization = 'no';
    localStorage.setItem('post_authorization', "no"); // Can now connect directly with the access token
    const profile = await fetchProfile(accessToken);
    populateUI(profile);
} else {
    console.log("Post Access Token");
    const profile = await fetchProfile(accessToken);
    populateUI(profile);
}


export async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = localStorage.getItem("verifier");
    console.log("verifier: "+ verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback"); // IDEALLY, THIS SHOULD BE A VARIABLE
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded"},
        body: params,
    });

    const { access_token } = await result.json();
    return access_token;
}

const getRefreshToken = async () => {
    // refresh token that has been previously stored
    const refreshToken = localStorage.getItem('refresh_token');
    const url = "https://accounts.spotify.com/api/token";

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId
        }),
    }
    const body = await fetch(url, payload);
    const response = await body.json();

    localStorage.setItem('access_token', response.accessToken);
    if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken);
    }
}

async function fetchProfile(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

function populateUI(profile: any) {
    document.getElementById("displayName")!.innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar")!.appendChild(profileImage);
    }
    document.getElementById("id")!.innerText = profile.id;
    document.getElementById("email")!.innerText = profile.email;
    document.getElementById("uri")!.innerText = profile.uri;
    document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url")!.innerText = profile.href;
    document.getElementById("url")!.setAttribute("href", profile.href);
    document.getElementById("imgUrl")!.innerText = profile.images[0]?.url ?? '(no profile image)';
}
  