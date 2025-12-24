export default function TwitterIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <mask id="mask0_2938_23462" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="2" y="2" width="16" height="16">
            <path d="M2 2H18V18H2V2Z" fill="white" />
        </mask>
        <g mask="url(#mask0_2938_23462)">
            <path d="M14.6 2.75H17.0537L11.6937 8.89171L18 17.2506H13.0629L9.19314 12.182L4.77029 17.2506H2.31429L8.04686 10.6791L2 2.75114H7.06286L10.5554 7.38314L14.6 2.75ZM13.7371 15.7786H15.0971L6.32 4.14543H4.86171L13.7371 15.7786Z" fill="black" />
        </g>
    </svg>
}