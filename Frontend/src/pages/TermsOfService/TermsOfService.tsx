import type { JSX } from "react";

export function TermsOfService(): JSX.Element {
    return (
        <div>
            <div className="bg-background-primary dark:bg-background-primary-dark min-h-screen flex flex-col gap-5 px-5 py-5">
                <h1 className="font-bold text-2xl">Terms of Service</h1>
                <p>By using our service, you agree to be bound by these Terms of Service. If you do not agree, you may not use the website.</p>
                <div className="flex flex-col gap-3">
                    <div>
                        <h3 className="font-semibold">Use of the service</h3>
                        <p>You are allowed to use our service as long as you follow these Terms. You may not use the website for illegal activities, attempt to disrupt its operation, attempt to hack in any way, unauthorized access to data, reverse engineering, or any behavior that damages the service or other users.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Accounts</h3>
                        <p>If you create an account, you are responsible for keeping your credentials secure. Any data leak caused by Carelessness within your credentials is not our responsibility. You must immediately notify us if you believe your account has been accessed without permission.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Content</h3>
                        <p>You are responsible for anything you upload. You confirm that your content does not violate any laws or rights of others.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Privacy</h3>
                        <p>Your use of the website is also governed by our <span className="text-blue-500 underline" onClick={() => window.location.href = "/policy"}>privacy policy</span>, which explain how we collect and handle your data. By using this website, you consent to that data handling.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Service Availability</h3>
                        <p>The website is provided as is. We do not guarantee constant uptime, perfect functionality, or error free operation. We may update, change, or suspend the service at any time. </p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Limitation of Liability</h3>
                        <p>To the maximum extent permitted by law, MyFinance is not responsible for any direct or indirect losses, damage, or issues that occur as a result of using the website. You use the website at your own risk.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}