import { Bodoni_Moda, Space_Mono, Noto_Sans_Devanagari } from 'next/font/google'

export const display = Bodoni_Moda({
  // headlines, names, taglines
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

export const mono = Space_Mono({
  // everything else — UI, labels, data
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const deva = Noto_Sans_Devanagari({
  // गोवा accent only
  subsets: ['devanagari'],
  weight: ['700'],
  variable: '--font-deva',
  display: 'swap',
})
