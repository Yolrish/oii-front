"use client"

import React from 'react'
import styles from './RegisterLogin.module.css'
import { registerUser, registerWithPopup } from '@/utils/Auth0/Register'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import MarkdownRenderer from '@/components/common/markdown/MarkdownRenderer'

type RegisterLoginProps = {
    isBusy: boolean
    onSwitchToLogin: () => void
    onProcessing: () => void
    onSuccess: (accessToken?: string, idToken?: string, expiresIn?: number) => void
    onError: (msg: string) => void
}

export default function RegisterLogin(props: RegisterLoginProps) {
    const { isBusy, onSwitchToLogin, onProcessing, onSuccess, onError } = props
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [name, setName] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState('')
    const [tip, setTip] = React.useState('')
    const [agreeTerms, setAgreeTerms] = React.useState(false)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (isBusy || loading) return
        setError('')
        setLoading(true)
        if (!agreeTerms) {
            setTip('Please agree to the terms and privacy policy')
            setLoading(false)
            return
        }
        registerUser({ email, password, name, given_name: name }, (err) => {
            setLoading(false)
            if (err) {
                const errMessage = `${err.code ?? 'Register failed, please try again'} \n ${err.policy ?? ''}`
                // onError(err.description || err.error || 'Register failed, please try again')
                setError(errMessage)
                return
            }
            setError('')
            setTip('')
            onSwitchToLogin()
        })
    }

    const handleSocialSignup = (provider: string) => {
        if (isBusy || loading) return
        setError('')
        setLoading(true)
        onProcessing()
        registerWithPopup(provider, (err, result) => {
            setLoading(false)
            if (err) {
                // onError(err.description || err.error || 'Register failed, please try again')
                setError(err.description || err.error || 'Register failed, please try again')
                return
            }
            const authResult = result as unknown as { accessToken?: string; idToken?: string; expiresIn?: number }
            onSuccess(authResult?.accessToken, authResult?.idToken, authResult?.expiresIn)
        })
    }

    return (
        <div className={styles.root}>

            {tip && <div className={styles.loginDialog_tip}>
                <MarkdownRenderer content={tip} variant='content' />
            </div>}
            {error && <div className={styles.loginDialog_error}>
                <MarkdownRenderer content={error} variant='content' />
            </div>}

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                    <label className={styles.label}>Full Name</label>
                    <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Password</label>
                    <input type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button
                    type="submit"
                    className={styles.submit}
                    disabled={isBusy || loading}
                >
                    {loading ? 'Creating account...' : 'Create account'}
                </button>
                <div className={styles.checkboxRow}>
                    <Checkbox
                        checked={agreeTerms}
                        onCheckedChange={(v) => {
                            setAgreeTerms(Boolean(v))
                            if (Boolean(v)) {
                                setTip('')
                            }
                        }}
                        className={styles.checkbox}
                    />
                    <span className={styles.checkboxLabel}>
                        {'by signing up, I agree to '}
                        <span className={styles.termsLink}>
                            <Link
                                href="/terms_of_service"
                                target="_blank"
                            >Terms of Service</Link>
                        </span>
                        {' and '}
                        <span className={styles.termsLink}>
                            <Link
                                href="/privacy_policy"
                                target="_blank"
                            >Privacy Policy
                            </Link>
                        </span>
                    </span>
                </div>
            </form>
            {/* 
            <div className={styles.switchRow}>
                <span>Already have an account?</span>
                <button type="button" className={styles.linkButton} onClick={onSwitchToLogin}>Sign in</button>
            </div> */}
        </div>
    )
}


