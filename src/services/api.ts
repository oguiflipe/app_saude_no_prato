import axios from "axios";

export const api = axios.create({
    baseURL: 'https://api.clarifai.com',
    headers: {
        "Authorization": "Key a5ca1a3410c24dc48bfa14a3cc60ea7a"
    }
})