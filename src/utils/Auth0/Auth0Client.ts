import auth0 from 'auth0-js'

export const auth0WebAuth = new auth0.WebAuth({
    domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
    clientID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
    responseType: 'token id_token',
})

export const auth0Authentication = new auth0.Authentication({
    domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
    clientID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
})
