// src/components/layout/floating-navbar.jsx (FIXED STYLING)
// ============================================
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/utils/utils";

export const FloatingNav = ({
  navItems,
  className,
  showLoginButton = true,
}) => {

  const handleNavClick = (e, link) => {
    e.preventDefault();
    const element = document.querySelector(link);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex max-w-fit fixed top-4 inset-x-0 mx-auto border border-transparent dark:border-white/[0.2] rounded-full dark:bg-black bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] px-8 py-2 items-center justify-center space-x-4",
          className,
        )}
      >
        {navItems.map((navItem, idx) => (
          <a
            key={`link=${idx}`}
            href={navItem.link}
            onClick={(e) => handleNavClick(e, navItem.link)}
            className={cn(
              "relative dark:text-neutral-50 items-center flex space-x-1 text-neutral-600 dark:hover:text-neutral-300 hover:text-neutral-500 transition-colors",
            )}
          >
            <span className="block sm:hidden">{navItem.icon}</span>
            <span className="hidden sm:block text-sm !text-neutral-600 dark:!text-neutral-50">
              {navItem.name}
            </span>
          </a>
        ))}

        {/* Login Button - Optional */}
        {showLoginButton && (
          <Link to="/login">
            <button className="relative border border-neutral-200 dark:border-white/[0.2] bg-transparent text-black dark:text-white text-sm font-medium px-4 py-2 rounded-full cursor-pointer transition-all duration-200 hover:bg-neutral-50/5 dark:hover:bg-white/5">
              {/* Icon untuk mobile */}
              <span className="block sm:hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </span>

              {/* Text untuk desktop */}
              <span className="hidden sm:block">Login</span>

              {/* Accent line di bawah - lebih terlihat */}
              <span className="absolute inset-x-0 w-3/4 mx-auto -bottom-px bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[2px] opacity-80" />
            </button>
          </Link>
        )}
      </motion.div>
  );
};
