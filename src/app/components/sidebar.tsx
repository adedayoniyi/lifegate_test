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
                <nav className="pt-4">
                    <ul>
                        <li>
                            <Link href="/chat">
                                <span className="block px-4 py-2 hover:bg-gray-700">
                                    Chat
                                </span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/diagnose">
                                <span className="block px-4 py-2 hover:bg-gray-700">
                                    Diagnosis
                                </span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/visual-analysis">
                                <span className="block px-4 py-2 hover:bg-gray-700">
                                    Visual Analysis
                                </span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );
}
