import Link from "next/link";

export function Logo() {
    return (
        <Link href="/dashboard" className="flex items-center gap-2 font-headline font-bold text-lg">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
            >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-primary">FinSarthi</span>
        </Link>
    )
}
