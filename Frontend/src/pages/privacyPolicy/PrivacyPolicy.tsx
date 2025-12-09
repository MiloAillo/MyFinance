import type { JSX } from "react";

export function PrivacyPolicy(): JSX.Element {
    return (
        <div className="bg-background-primary dark:bg-background-primary-dark min-h-screen flex flex-col gap-5 px-5 py-5">
            <h1 className="font-bold text-2xl">Privacy Policy</h1>
            <p>This Privacy Policy explains how MyFinance collects, uses, and protects your personal information when you access or use our website and services. By using the website, you agree to the practices described in this Policy.</p>
            <div className="flex flex-col gap-3">
                <div>
                    <h3 className="font-semibold">Information We Collect</h3>
                    <p>We may collect information that you provide directly, such as name, email address, account details, or any content you submit.</p>
                </div>
                <div>
                    <h3 className="font-semibold">Use of Information</h3>
                    <p>We use the information only for website operational purposes. Your information may also be used to comply with legal obligations.</p>
                </div>
                <div>
                    <h3 className="font-semibold">Sharing of Information</h3>
                    <p>We do not sell your personal information. We may also disclose information if required by law or to protect our rights, users, or the security of the service.</p>
                </div>
                <div>
                    <h3 className="font-semibold">Data Security</h3>
                    <p>We take reasonable steps to protect your information from unauthorized access, loss, misuse, or alteration. However, no system is completely secure, and we cannot guarantee absolute protection.</p>
                </div>
            </div>
        </div>
    )
}