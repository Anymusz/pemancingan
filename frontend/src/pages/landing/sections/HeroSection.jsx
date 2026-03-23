// src/pages/landing/sections/HeroSection.jsx
import { motion } from "framer-motion";
import { Button } from "@/components/common/Button";
import { ArrowRight, ChevronDown } from "lucide-react";
import GradientBg from "@/components/layout/gradient-bg";

const FLOATING_ELEMENTS = [
  {
    id: 1,
    width: 75,
    height: 80,
    left: 15,
    top: 20,
    duration: 8,
    delay: 0.5,
    xRange: 10,
    yRange: -8,
  },
  {
    id: 2,
    width: 60,
    height: 65,
    left: 70,
    top: 15,
    duration: 7,
    delay: 1.2,
    xRange: -12,
    yRange: 15,
  },
  {
    id: 3,
    width: 90,
    height: 95,
    left: 25,
    top: 65,
    duration: 9,
    delay: 0.8,
    xRange: 8,
    yRange: 10,
  },
  {
    id: 4,
    width: 50,
    height: 55,
    left: 80,
    top: 70,
    duration: 6,
    delay: 1.5,
    xRange: -10,
    yRange: -12,
  },
  {
    id: 5,
    width: 70,
    height: 72,
    left: 45,
    top: 40,
    duration: 7.5,
    delay: 0.3,
    xRange: 15,
    yRange: 8,
  },
];

const STATS = [
  { label: "Components", value: "150+" },
  { label: "Downloads", value: "10k+" },
  { label: "Satisfaction", value: "99%" },
];

function HeroSection() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Gradient Background - REPLACE old background pattern */}
      <div className="absolute inset-0 z-0">
        <GradientBg theme="light" />
      </div>

      {/* Split Content */}
      <div className="container relative z-10 px-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        <div className="grid min-h-screen grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left Side - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center py-12 lg:py-20"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary">
                Revolutionary UI Library
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Split Reveal
              </motion.span>
              <motion.span
                className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 dark:from-primary dark:to-purple-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Animation
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8 text-lg text-muted-foreground sm:text-xl max-w-xl"
            >
              Create stunning interfaces with our modern component library
              featuring split-screen layouts and scroll-based reveal animations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="gap-2 text-lg ">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="text-lg">
                  Documentation
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="grid grid-cols-3 gap-4 mt-16 sm:gap-6"
            >
              {STATS.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="text-2xl font-bold sm:text-3xl text-foreground"
                  >
                    {stat.value}
                  </motion.div>
                  <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Code Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center py-12 lg:py-20"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="relative w-full max-w-md"
            >
              <motion.div
                className="p-6 overflow-hidden border shadow-xl rounded-lg bg-card"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Window Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="px-2 py-1 text-xs rounded bg-muted">
                    component.tsx
                  </div>
                </div>

                {/* Code Content */}
                <div className="text-sm font-mono">
                  <div className="text-muted-foreground">
                    <span className="text-green-500">import</span> {"{"}
                    <span className="text-blue-500"> motion </span>
                    {"}"} <span className="text-green-500">from</span>{" "}
                    <span className="text-orange-400">
                      &apos;framer-motion&apos;
                    </span>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    <span className="text-purple-500">
                      export default function
                    </span>{" "}
                    <span className="text-blue-500">Component</span>() {"{"}
                  </div>
                  <div className="pl-4 mt-1 text-muted-foreground">
                    <span className="text-purple-500">return</span> (
                  </div>
                  <div className="pl-8 mt-1 text-muted-foreground">
                    &lt;<span className="text-blue-500">motion.div</span>
                  </div>
                  <div className="pl-12 mt-1 text-muted-foreground">
                    <span className="text-green-500">initial</span>={"{"}
                    {"{"}
                    <span className="text-orange-400">opacity: 0</span> {"}"}
                    {"}"}
                  </div>
                  <div className="pl-12 mt-1 text-muted-foreground">
                    <span className="text-green-500">animate</span>={"{"}
                    {"{"}
                    <span className="text-orange-400">opacity: 1</span> {"}"}
                    {"}"}
                  </div>
                  <div className="pl-8 mt-1 text-muted-foreground">&gt;</div>
                  <div className="pl-12 mt-1 text-muted-foreground">
                    <span className="text-foreground">Your content here</span>
                  </div>
                  <div className="pl-8 mt-1 text-muted-foreground">
                    &lt;/<span className="text-blue-500">motion.div</span>&gt;
                  </div>
                  <div className="pl-4 mt-1 text-muted-foreground">)</div>
                  <div className="mt-1 text-muted-foreground">{"}"}</div>
                </div>
              </motion.div>

              {/* Decorative Elements */}
              <motion.div
                className="absolute -z-10 -top-6 -left-6 w-24 h-24 rounded-lg bg-primary/10"
                animate={{
                  rotate: [0, 10, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -z-10 -bottom-6 -right-6 w-24 h-24 rounded-lg bg-purple-500/10"
                animate={{
                  rotate: [0, -10, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
            </motion.div>

            {/* Remove old floating elements - diganti dengan GradientBg */}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute transform -translate-x-1/2 bottom-8 left-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </div>
    </div>
  );
}

export default HeroSection;
