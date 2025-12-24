"use client"

import React from 'react'
import styles from './SocialLogin.module.css'
import { cn } from '@/lib/utils'

type SocialLoginProps = {
    isBusy: boolean
    isEmailButtonBusy: boolean
    onGoogle: () => void
    onApple: () => void
    onEmail: () => void
}

export default function SocialLogin(props: SocialLoginProps) {

    const {
        isBusy,
        isEmailButtonBusy,
        onGoogle,
        onApple,
        onEmail
    } = props

    return (
        <>
            <button
                className={cn(
                    styles.loginDialog_socialButton,
                    styles.google_button
                )}
                onClick={onGoogle}
                disabled={isBusy}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="20" viewBox="0 0 19 20" fill="none">
                    <path d="M15.5725 9.93569C15.5725 9.38382 15.5328 8.98111 15.4468 8.56348H9.85449V11.0543H13.1371C13.0709 11.6734 12.7135 12.6056 11.9193 13.232L11.9082 13.3154L13.6764 14.859L13.7989 14.8727C14.9239 13.7019 15.5725 11.9791 15.5725 9.93569Z" fill="#4285F4" />
                    <path d="M9.88289 16.2754C11.6197 16.2754 13.0778 15.7316 14.1428 14.7937L12.1129 13.2984C11.5697 13.6586 10.8406 13.9101 9.88289 13.9101C8.18178 13.9101 6.73798 12.843 6.22331 11.3682L6.14787 11.3743L4.1622 12.8355L4.13623 12.9042C5.19406 14.9024 7.36692 16.2754 9.88289 16.2754Z" fill="#34A853" />
                    <path d="M6.28066 11.2082C6.14066 10.8216 6.05963 10.4074 6.05963 9.97941C6.05963 9.55137 6.14066 9.13717 6.27329 8.75058L6.26958 8.66825L4.19683 7.16016L4.12901 7.19038C3.67954 8.03261 3.42163 8.97841 3.42163 9.97941C3.42163 10.9804 3.67954 11.9262 4.12901 12.7684L6.28066 11.2082Z" fill="#FBBC05" />
                    <path d="M9.85837 6.02148C11.0611 6.02148 11.8725 6.51764 12.3351 6.93227L14.1428 5.24668C13.0326 4.26116 11.5878 3.65625 9.85837 3.65625C7.35314 3.65625 5.18955 5.02917 4.13623 7.02738L6.20729 8.56346C6.72688 7.08858 8.16452 6.02148 9.85837 6.02148Z" fill="#EB4335" />
                </svg>
                <span className={cn(
                    styles.loginDialog_socialButton_text,
                    styles.google_button_text
                )}>
                    Continue with Google
                </span>
            </button>

            <button
                className={cn(
                    styles.loginDialog_socialButton,
                    styles.apple_button
                )}
                onClick={onApple}
                disabled={isBusy}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                    <path d="M14.7077 16.8971C13.891 17.6887 12.9993 17.5637 12.141 17.1887C11.2327 16.8054 10.3993 16.7887 9.44099 17.1887C8.24099 17.7054 7.60766 17.5554 6.89099 16.8971C2.82432 12.7054 3.42432 6.32207 8.04099 6.08874C9.16599 6.14707 9.94932 6.7054 10.6077 6.7554C11.591 6.5554 12.5327 5.9804 13.5827 6.0554C14.841 6.1554 15.791 6.6554 16.416 7.5554C13.816 9.11374 14.4327 12.5387 16.816 13.4971C16.341 14.7471 15.7243 15.9887 14.6993 16.9054L14.7077 16.8971ZM10.5243 6.03874C10.3993 4.1804 11.9077 2.64707 13.641 2.49707C13.8827 4.64707 11.691 6.24707 10.5243 6.03874Z" fill="#262722" />
                </svg>
                <span className={cn(
                    styles.loginDialog_socialButton_text,
                    styles.apple_button_text
                )}>
                    Continue with Apple
                </span>
            </button>

            <div className={styles.loginDialog_divider}>
                <span className={styles.loginDialog_divider_text}>or sign in with email</span>
            </div>

            <button
                className={cn(
                    styles.loginDialog_socialButton,
                    styles.email_button,
                    isEmailButtonBusy && styles.email_button_busy
                )}
                onClick={onEmail}
                disabled={isBusy || isEmailButtonBusy}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                    <path d="M15.1683 5H5.83496C5.30453 5 4.79582 5.19754 4.42075 5.54917C4.04567 5.90081 3.83496 6.37772 3.83496 6.875V13.125C3.83496 13.6223 4.04567 14.0992 4.42075 14.4508C4.79582 14.8025 5.30453 15 5.83496 15H15.1683C15.6987 15 16.2074 14.8025 16.5825 14.4508C16.9576 14.0992 17.1683 13.6223 17.1683 13.125V6.875C17.1683 6.37772 16.9576 5.90081 16.5825 5.54917C16.2074 5.19754 15.6987 5 15.1683 5ZM15.1683 6.25L10.835 9.04375C10.7336 9.09861 10.6187 9.12748 10.5016 9.12748C10.3846 9.12748 10.2696 9.09861 10.1683 9.04375L5.83496 6.25H15.1683Z" fill="white" />
                </svg>
                <span className={cn(
                    styles.loginDialog_socialButton_text,
                    styles.email_button_text
                )}>
                    {isEmailButtonBusy ? 'Processing...' : 'Continue with Email'}
                </span>
            </button>
        </>
    )
}


