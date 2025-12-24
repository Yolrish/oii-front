interface IconProps {
    className?: string
    mode?: 'line' | 'fill'
}

export default function FavorIcon({
    className,
}: IconProps) {
    return (
        <svg
            className={className}
            width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M7.52637 0.625H7.79785C11.0814 0.625 13.7754 3.37309 13.7754 6.80273C13.7756 7.72098 13.5994 8.63013 13.2588 9.47754C12.9182 10.3248 12.4196 11.0936 11.792 11.7402C11.1644 12.3869 10.4201 12.8983 9.60254 13.2471C8.78513 13.5957 7.90989 13.7756 7.02637 13.7754H0.958008L2.22266 12.7295C2.39764 12.5847 2.51948 12.3881 2.57422 12.1709C2.62886 11.9536 2.61482 11.7234 2.53223 11.5146L1.74414 9.52344C0.0553205 5.24957 3.11511 0.625033 7.52637 0.625Z" stroke="#20201E" strokeWidth="1.25" />
        </svg>
    )
}