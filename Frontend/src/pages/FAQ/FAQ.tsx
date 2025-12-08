import type { JSX } from "react";

export function FAQ(): JSX.Element {
    return (
        <div>
            <div className="bg-background-primary dark:bg-background-primary-dark min-h-screen flex flex-col gap-5 px-5 py-5">
                <h1 className="font-bold text-2xl">Frequently Asked Questions (FAQ)</h1>
                <div className="flex flex-col gap-3">
                    <div>
                        <h3 className="font-semibold">Why is search mode disabled?</h3>
                        <p>The search mode is disabled in the local environment because unlike MyCloud environment who use advanced database for storage, local environment has different way of handling data and has big limitation. We are so sorry, there is no possible thing we could do to fix this.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Why i can't create a local account?</h3>
                        <p>Your browser doesn't support with "indexeddb" technology. Updating or changing browser may help.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Why tracker only show 7 newest transaction?</h3>
                        <p>To improve performance, we decide to only show the 7 newest transaction rather than pulling every data out to calculate.  To gain access to many transactions, you can go to the "Transactions History" or "Report & Insight" page.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}