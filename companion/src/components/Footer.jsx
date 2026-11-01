import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-[#242c38] bg-[#0e121a] py-6 mt-12 text-xs text-[#7a8694]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4">
        <div className="space-y-1 text-center lg:text-left">
          <p>
            © 2025 Smolk Apps • Created by{" "}
            <a
              href="https://www.smolkin.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#aeb8c4] hover:underline"
            >
              Michael Smolkin
            </a>
          </p>
          <p>
            Study progress is stored only on this device. Reference data compiled from{" "}
            <a
              href="https://ciaaw.org/atomic-weights.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#aeb8c4] hover:underline"
            >
              IUPAC CIAAW
            </a>
            ,{" "}
            <a
              href="https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#aeb8c4] hover:underline"
            >
              NIST ASD
            </a>{" "}
            and{" "}
            <a
              href="https://pubchem.ncbi.nlm.nih.gov/periodic-table/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#aeb8c4] hover:underline"
            >
              PubChem
            </a>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link to="/elements" className="text-[#aeb8c4] hover:text-white">
            All 118 Elements
          </Link>
          <Link to="/compare" className="text-[#aeb8c4] hover:text-white">
            Compare
          </Link>
          <Link to="/practice" className="text-[#aeb8c4] hover:text-white">
            Practice
          </Link>
          <Link to="/privacy" className="text-[#aeb8c4] hover:text-white">
            Privacy
          </Link>
          <Link to="/terms" className="text-[#aeb8c4] hover:text-white">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}