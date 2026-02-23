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
    draw('482 W. San Ysidro Blvd. Apt. 123', 32, 688)    // 2a. Street
    draw('San Ysidro', 32, 648)                            // 2c. City
    draw('CA', 225, 648)                                   // 2d. State
    draw('92173', 310, 648)                                // 2e. ZIP

    // === Section 3: Residential/Personal Use checkbox ===
    draw('X', 222, 600, 9)

    // === Section 4: Applicant ===
    draw(lastName, 32, 568)                                // 4a. Last Name
    draw(firstName, 190, 568)                              // 4b. First Name
    draw(profile.phone || '', 32, 537)                     // 4d. Phone
    draw(profile.email || '', 210, 537)                    // 4e. Email

    // Street address: combine street + exterior_number
    const addr = profile.address || {}
    const streetLine = [addr.street, addr.exterior_number].filter(Boolean).join(' ')
    draw(streetLine, 32, 505)                              // 4f. Street
    draw(addr.municipio || '', 32, 473)                    // 4g. City
    draw(addr.estado || '', 190, 473)                      // 4h. State
    draw(addr.postal_code || '', 280, 473)                 // 4i. ZIP
    draw('Mexico', 355, 473)                               // 4j. Country

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
