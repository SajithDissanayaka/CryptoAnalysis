import { useState, type FormEvent } from "react"
import { getCurrentUser, login } from "../api/auth"
import { saveAccessToken } from "../utils/token"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from 'react-router'


function LoginPage() {

    const {setUser} = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()

        setError('')
        setLoading(true)

        try {
            const result = await login({
                email,
                password,
            })

            saveAccessToken(result.access_token)

            const currentUser = await getCurrentUser()

            setUser(currentUser)
            navigate('/dashboard',{replace:true})

            console.log('Current user:',currentUser)

        } catch (error) {
            console.error(error)

            setError('Invalid email or password')

        } finally {
            setLoading(false)
        }
            }


    return (
        <div>
            <h1>Login CryptoMind AI</h1>

            <form onSubmit={handleSubmit}>

                <div>
                    <label htmlFor="email">
                        Email
                    </label>

                    <input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                    />
                </div>

                <div>
                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                    />
                </div>

                {error && (
                    <p>{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>

            </form>
        </div>
    )
}


export default LoginPage