interface IconProps {
    className?: string
    mode?: 'line' | 'fill'
}

export default function ShareIcon({
    className,
}: IconProps) {
    return (
        <svg
            className={className}
            width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12.4619 7.32812L11.8096 7.2998C10.0376 7.2223 6.53392 7.41772 4.14746 9.81055V9.81152C2.53167 11.4305 2.04965 13.4744 1.91992 15.6699C2.27909 15.3434 2.72527 14.9884 3.26758 14.6426C5.0476 13.5076 7.82925 12.4846 11.8848 12.791L12.4619 12.835V16.1631L15.9023 13.29L19.0762 10.6396L15.9248 7.48242L12.4619 4.01074V7.32812Z" stroke="#20201E" strokeWidth="1.25" />
        </svg>
    )
}