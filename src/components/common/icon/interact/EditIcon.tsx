interface IconProps {
    className?: string
}

export default function FavorIcon({
    className,
}: IconProps) {

    return (
        <svg
            className={className}
            width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12.5 5.00007L15 7.50007M10.8334 16.6667H17.5M4.16671 13.3334L3.33337 16.6667L6.66671 15.8334L16.3217 6.17841C16.6342 5.86586 16.8097 5.44201 16.8097 5.00007C16.8097 4.55813 16.6342 4.13429 16.3217 3.82174L16.1784 3.67841C15.8658 3.36596 15.442 3.19043 15 3.19043C14.5581 3.19043 14.1343 3.36596 13.8217 3.67841L4.16671 13.3334Z" stroke="#262722" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )

}
