// ============================================
// EXPORTACIÓN DE FICHAS TÉCNICAS A PDF
// ============================================

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Property, User } from '@/types';

interface PDFExportOptions {
  property: Property;
  agent: User | null;
  showAgentData: boolean;
}

export async function exportPropertyToPDF({ property, agent, showAgentData }: PDFExportOptions): Promise<void> {
  // Crear un elemento temporal para renderizar la ficha
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '800px';
  tempDiv.style.backgroundColor = '#ffffff';
  tempDiv.style.padding = '40px';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  
  // Obtener imagen principal
  const mainImage = property.images.find(img => img.isMain)?.url || property.images[0]?.url;
  
  // Generar HTML de la ficha
  const agentSection = showAgentData && agent ? `
    <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #1e40af;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Contacta al Agente</h3>
      <div style="display: flex; align-items: center; gap: 15px;">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #1e40af, #3b82f6); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
          ${agent.name.charAt(0)}${agent.lastName.charAt(0)}
        </div>
        <div>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">${agent.name} ${agent.lastName}</p>
          ${agent.config?.certificateNumber ? `<p style="margin: 5px 0; font-size: 12px; color: #059669;">✓ Certificado: ${agent.config.certificateNumber}</p>` : ''}
          ${showAgentData && agent.config?.whatsappNumber ? `<p style="margin: 5px 0; font-size: 14px; color: #64748b;">📱 WhatsApp: ${agent.config.whatsappNumber}</p>` : ''}
          ${showAgentData ? `<p style="margin: 5px 0; font-size: 14px; color: #64748b;">📞 Teléfono: ${agent.phone}</p>` : ''}
          ${showAgentData && agent.config?.shareSettings?.showEmail ? `<p style="margin: 5px 0; font-size: 14px; color: #64748b;">✉️ Email: ${agent.email}</p>` : ''}
        </div>
      </div>
    </div>
  ` : '';

  const amenitiesHtml = property.features.amenities.length > 0 
    ? `<div style="margin-top: 20px;">
        <h3 style="color: #1e293b; margin-bottom: 10px;">Amenidades</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${property.features.amenities.map(a => `<span style="background-color: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${a}</span>`).join('')}
        </div>
       </div>`
    : '';

  const tagsHtml = property.tags.length > 0
    ? `<div style="margin-top: 15px;">
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${property.tags.map(t => `<span style="background-color: #f1f5f9; color: #475569; padding: 3px 10px; border-radius: 4px; font-size: 11px;">#${t}</span>`).join('')}
        </div>
       </div>`
    : '';
  
  tempDiv.innerHTML = `
    <div style="max-width: 720px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #1e40af;">
        <h1 style="color: #1e40af; margin: 0; font-size: 28px; font-weight: bold;">GRUPO FELMAT</h1>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Ficha Técnica de Propiedad</p>
      </div>
      
      <!-- Imagen principal -->
      ${mainImage ? `<div style="margin-bottom: 25px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <img src="${mainImage}" style="width: 100%; height: 300px; object-fit: cover;" />
      </div>` : ''}
      
      <!-- Título y precio -->
      <div style="margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
          <div style="flex: 1;">
            <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">${property.title}</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px;">📍 ${property.location.address}, ${property.location.neighborhood}, ${property.location.city}, ${property.location.state}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #1e40af; margin: 0; font-size: 32px; font-weight: bold;">$${property.price.toLocaleString('es-MX')}</p>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">${property.priceCurrency} - ${property.transactionType === 'venta' ? 'En Venta' : property.transactionType === 'renta' ? 'En Renta' : 'Venta o Renta'}</p>
          </div>
        </div>
        ${tagsHtml}
      </div>
      
      <!-- Características -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
        <div style="text-align: center; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
          <p style="font-size: 28px; margin: 0; color: #1e40af; font-weight: bold;">${property.features.bedrooms}</p>
          <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">Recámaras</p>
        </div>
        <div style="text-align: center; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
          <p style="font-size: 28px; margin: 0; color: #1e40af; font-weight: bold;">${property.features.bathrooms}</p>
          <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">Baños</p>
        </div>
        <div style="text-align: center; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
          <p style="font-size: 28px; margin: 0; color: #1e40af; font-weight: bold;">${property.features.parkingSpaces}</p>
          <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">Estacionamientos</p>
        </div>
        <div style="text-align: center; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
          <p style="font-size: 28px; margin: 0; color: #1e40af; font-weight: bold;">${property.features.constructionArea}</p>
          <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">m² Construcción</p>
        </div>
      </div>
      
      <!-- Descripción -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b; margin-bottom: 10px; font-size: 18px;">Descripción</h3>
        <p style="color: #475569; line-height: 1.6; margin: 0; font-size: 14px; text-align: justify;">${property.description || 'Sin descripción disponible.'}</p>
      </div>
      
      ${amenitiesHtml}
      
      <!-- Información adicional -->
      <div style="margin-top: 25px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
        <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px;">Información Adicional</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px;">
          <p><strong>Ciudad:</strong> ${property.location.city}</p>
          <p><strong>Estado:</strong> ${property.location.state}</p>
          ${property.location.zipCode ? `<p><strong>C.P.:</strong> ${property.location.zipCode}</p>` : ''}
          <p><strong>Tipo:</strong> ${property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}</p>
          <p><strong>Estado:</strong> ${property.status === 'disponible' ? 'Disponible' : property.status === 'reservado' ? 'Reservado' : property.status === 'vendido' ? 'Vendido' : property.status === 'rentado' ? 'Rentado' : property.status}</p>
          ${property.location.references ? `<p style="grid-column: span 2;"><strong>Referencias:</strong> ${property.location.references}</p>` : ''}
        </div>
      </div>
      
      ${agentSection}
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">Ficha generada por Grupo FELMAT - CRM Inmobiliario</p>
        <p style="color: #94a3b8; font-size: 10px; margin: 5px 0 0 0;">${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(tempDiv);
  
  try {
    // Esperar a que las imágenes carguen
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Capturar el elemento como canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    // Crear PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    let imgY = 10;
    
    const imgData = canvas.toDataURL('image/png');
    
    // Calcular cuántas páginas necesitamos
    const scaledHeight = imgHeight * ratio * (pdfWidth / (imgWidth * ratio));
    let heightLeft = scaledHeight;
    let position = 0;
    
    // Primera página
    pdf.addImage(imgData, 'PNG', imgX, imgY, pdfWidth - 20, scaledHeight);
    heightLeft -= pdfHeight;
    
    // Páginas adicionales si es necesario
    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', imgX, position, pdfWidth - 20, scaledHeight);
      heightLeft -= pdfHeight;
    }
    
    // Descargar PDF
    pdf.save(`Ficha_${property.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`);
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('No se pudo generar el PDF');
  } finally {
    document.body.removeChild(tempDiv);
  }
}

export default exportPropertyToPDF;
