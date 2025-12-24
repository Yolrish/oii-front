"use client"

import React from 'react'
import styles from './EmailLogin.module.css'
import { cn } from '@/lib/utils'
import MarkdownRenderer from '@/components/common/markdown/MarkdownRenderer'

type EmailLoginProps = {
    email: string
    password: string
    isBusy: boolean
    loading: boolean
    error: string
    onEmailChange: (v: string) => void
    onPasswordChange: (v: string) => void
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    onBack: () => void
    onSwitchToRegister?: () => void
}

export default function EmailLogin(props: EmailLoginProps) {
    
    const {
        email,
        password,
        isBusy,
        loading,
        error,
        onEmailChange,
        onPasswordChange,
        onSubmit,
        onBack
    } = props

    return (
        <>

            {error && (
                <div className={styles.loginDialog_error}>
                    <MarkdownRenderer content={error} variant='content' />
                </div>
            )}

            <form className={styles.loginDialog_form} onSubmit={onSubmit}>
                <div className={styles.loginDialog_formField}>
                    <label className={styles.loginDialog_formLabel}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => onEmailChange(e.target.value)}
                        className={styles.loginDialog_input}
                        placeholder=""
                        disabled={isBusy || loading}
                        required
                    />
                </div>
                <div className={styles.loginDialog_formField}>
                    <label className={styles.loginDialog_formLabel}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        className={styles.loginDialog_input}
                        placeholder=""
                        disabled={isBusy || loading}
                        required
                    />
                </div>
                <button
                    type="submit"
                    className={styles.loginDialog_submitButton}
                    disabled={isBusy || loading}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <div className={styles.loginDialog_divider}>
                <span className={styles.loginDialog_divider_text}>or choose a provider</span>
            </div>

            <button
                className={cn(
                    styles.loginDialog_socialButton
                )}
                onClick={onBack}
                disabled={isBusy}
            >
                Back
            </button>

            {props.onSwitchToRegister && (
                <div className={styles.loginDialog_switchRow}>
                    <span>Don't have an account?</span>
                    <button type="button" className={styles.loginDialog_linkButton} onClick={props.onSwitchToRegister}>Create one</button>
                </div>
            )}
        </>
    )
}


