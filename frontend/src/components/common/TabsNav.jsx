import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils/utils";
import { motion, AnimatePresence } from "framer-motion";

export function TabsNav({ items, value, onValueChange, className }) {
  return (
    <div className={cn("w-full", className)}>
      <Tabs
        value={value}
        onValueChange={onValueChange}
        className="w-full flex justify-center"
      >
        <TabsList
          className={cn(
            "relative flex gap-2 bg-background/30 rounded-xl border",
            "p-1 sm:p-2",
            "overflow-x-auto sm:overflow-visible",
            "justify-start sm:justify-center hide-scrollbar",
            "w-auto", // mobile full, desktop auto
            "lg:max-w-2xl", // batas lebar saat lg
          )}
        >
          {items.map((item) => {
            const isActive = item.value === value;

            return (
              <TabsTrigger key={item.value} value={item.value} asChild>
                <motion.button
                  className={cn(
                    "relative flex items-center justify-between whitespace-nowrap rounded-lg transition-colors font-medium",
                    "shrink-0 md:flex-1 lg:flex-none", // ❗ penting: lg jangan stretch
                    "px-2 sm:px-3 md:px-4 lg:px-3", // lg lebih kecil
                    "py-1.5 sm:py-2 lg:py-1.5",
                    "text-xs sm:text-sm lg:text-sm", // lg jangan terlalu besar
                    isActive ? "text-white" : "text-foreground/80",
                  )}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Active background */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-primary/10 rounded-lg z-0"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  )}

                  {/* Label */}
                  <span className="relative z-10">{item.label}</span>

                  {/* Badge */}
                  <AnimatePresence mode="popLayout">
                    {item.badge && item.badge > 0 && (
                      <motion.span
                        key={item.badge}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={cn(
                          "ml-2 relative z-10 inline-flex items-center justify-center rounded-full bg-sky-500 text-white font-bold",
                          "min-w-[18px] sm:min-w-[20px]",
                          "h-4 sm:h-5",
                          "px-1.5 sm:px-2",
                          "text-[10px] sm:text-xs",
                        )}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
