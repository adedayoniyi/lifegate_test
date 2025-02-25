"use client"
import Link from "next/link";
import { useState } from "react";

export default function Sidebar() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Mobile menu toggle button */}
            <button
                onClick={() => setOpen(!open)}
                className="p-2 bg-gray-200 md:hidden"
            >
                {open ? "Close Menu" : "Menu"}
            </button>

            <div
                className={`${open ? "block" : "hidden"
                    } md:block w-64 bg-gray-800 text-white h-full top-0 left-0 fixed md:relative`}
            >
                <nav className="pt-4 space-y-1">
                    <Link href="/chat">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Chat
                        </span>
                    </Link>
                    <Link href="/diagnose">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Diagnosis
                        </span>
                    </Link>
                    <Link href="/visual-analysis">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Visual Analysis
                        </span>
                    </Link>
                    {/* New Menu Items */}
                    <Link href="/patient-update">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Patient Update
                        </span>
                    </Link>
                    <Link href="/clinician-actions">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Clinician Actions
                        </span>
                    </Link>
                    <Link href="/imaging-interpretation">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Imaging Interpretation
                        </span>
                    </Link>
                    <Link href="/treatment-protocol">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Treatment Protocol
                        </span>
                    </Link>
                    <Link href="/medication-suggestions">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Medication Suggestions
                        </span>
                    </Link>
                </nav>
            </div>
        </>
    );
}
