
"use client"

import NextImage from "next/image"
import type { ComponentProps } from "react"
import { forwardRef } from "react"

import { cn } from "@/lib/utils"

export const Image = forwardRef<
  HTMLImageElement,
  ComponentProps<typeof NextImage>
>(({ className, ...props }, ref) => (
  <NextImage ref={ref} className={cn(className)} {...props} />
))

Image.displayName = "Image"
