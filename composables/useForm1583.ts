// composables/useForm1583.ts
export const useForm1583 = () => {
  const { $customFetch } = useNuxtApp()

  const downloadForm = async () => {
    // Fetch profile for address data
    const response = await $customFetch('/profile')
    const profile = response.data

    // Dynamic import (client-side only)
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')

    // Load blank PDF
    const pdfBytes = await fetch('/forms/ps1583.pdf').then(r => r.arrayBuffer())
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const page = pdfDoc.getPage(0)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontSize = 10
    const color = rgb(0, 0, 0)

    const draw = (text: string, x: number, y: number, size = fontSize) => {
      if (!text) return
      page.drawText(text, { x, y, size, font, color })
    }

    // Split name: last word = lastName, rest = firstName
    const nameParts = (profile.name || '').trim().split(' ')
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] || ''
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : ''

    // === Section 2: CMRA (Boxly) ===
    draw('482 W. San Ysidro Blvd. Apt. 123', 30, 667)
    draw('San Ysidro', 30, 638)
    draw('CA', 178, 638)
    draw('92173', 240, 638)

    // === Section 3: Residential/Personal Use checkbox ===
    draw('X', 170, 613, 11)

    // === Section 4: Applicant ===
    draw(lastName, 30, 581)
    draw(firstName, 170, 581)
    draw(profile.phone || '', 30, 549)
    draw(profile.email || '', 178, 549)

    // Street address: combine street + exterior_number
    const addr = profile.address || {}
    const streetLine = [addr.street, addr.exterior_number].filter(Boolean).join(' ')
    draw(streetLine, 30, 517)
    draw(addr.municipio || '', 30, 485)
    draw(addr.estado || '', 178, 485)
    draw(addr.postal_code || '', 240, 485)
    draw('Mexico', 300, 485)

    // Save and trigger download
    const filledBytes = await pdfDoc.save()
    const blob = new Blob([filledBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'PS_Form_1583_Boxly.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return { downloadForm }
}
