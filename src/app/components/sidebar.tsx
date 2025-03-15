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
                    <Link href="/diagnosis">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Diagnosis
                        </span>
                    </Link>
                    <Link href="/suggested-actions">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Suggested Actions
                        </span>
                    </Link>
                    {/* New Menu Items */}
                    <Link href="/prescription-check">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Prescription Check
                        </span>
                    </Link>
                    <Link href="/pending-tasks">
                        <span className="block px-4 py-2 hover:bg-gray-700 cursor-pointer">
                            Pending Tasks
                        </span>
                    </Link>

                </nav>
            </div>
        </>
    );
}
