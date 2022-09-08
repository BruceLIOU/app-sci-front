import axios from 'axios'
const api_url = 'http://localhost:3000'

export default axios.create({
  baseURL: `${api_url}/api`,
  headers: {
    'Content-type': 'application/json',
  },
})
