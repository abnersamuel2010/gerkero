import imgMarmitaPicanha from '../assets/images/marmita_executiva_picanha_1790819586479.jpg';
import imgMarmitaFrango from '../assets/images/marmita_frango_grelhado_1790819596080.jpg';
import imgPorcaoChurrasco from '../assets/images/porcao_churrasco_misto_1790819607035.jpg';
import imgSaladaFresca from '../assets/images/salada_fresca_artesanal_1791336805166.jpg';
import imgBebidasGeladas from '../assets/images/bebidas_geladas_refri_1791336818190.jpg';
import imgCarnesGrelhadas from '../assets/images/carnes_grelhadas_brasa_1791336832609.jpg';

/**
 * Retorna uma imagem em alta resolução para cada prato ou bebida.
 * Se o produto já possui uma imagem customizada fornecida no cardápio/banco, ela é utilizada prioritariamente.
 */
export function obterImagemProduto(prod: {
  nome?: string;
  categoria?: string;
  imagemUrl?: string;
}): string {
  if (prod.imagemUrl && prod.imagemUrl.trim().length > 5) {
    return prod.imagemUrl;
  }

  const nome = (prod.nome || '').toLowerCase();
  const cat = (prod.categoria || '').toLowerCase();

  // 1. Carnes específicas
  if (nome.includes('feijoada')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('costela')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('frango ao molho')) {
    return 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('panqueca')) {
    return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('linguiça') || nome.includes('linguica')) {
    return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('picadinho')) {
    return 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('frango frito')) {
    return 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('porco no tacho') || nome.includes('porco assado')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('carne ao molho')) {
    return 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('frango assado')) {
    return 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('grelhado') || nome.includes('filé de frango') || nome.includes('file de frango')) {
    return imgMarmitaFrango;
  }
  if (nome.includes('lasanha')) {
    return 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('strogonoff')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80';
  }

  // 2. Saladas
  if (cat.includes('salada') || nome.includes('salada')) {
    return imgSaladaFresca;
  }

  // 3. Bebidas específicas
  if (nome.includes('coca-cola lata') || (nome.includes('coca') && nome.includes('lata'))) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('coca')) {
    return 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('tubaina') || nome.includes('tubaína')) {
    return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('água com gás') || nome.includes('agua com gas')) {
    return 'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=800&q=80';
  }
  if (nome.includes('água') || nome.includes('agua')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80';
  }
  if (cat.includes('bebida') || nome.includes('refri')) {
    return imgBebidasGeladas;
  }

  // 4. Doces e Sobremesas
  if (nome.includes('trufa') || nome.includes('chocolate')) {
    return 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80';
  }
  if (cat.includes('doce') || nome.includes('canudo') || nome.includes('paçoca') || nome.includes('pacoca')) {
    return 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=800&q=80';
  }

  // 5. Marmitas
  if (nome.includes('marmita pequena')) {
    return imgMarmitaFrango;
  }
  if (nome.includes('marmita grande')) {
    return imgMarmitaPicanha;
  }
  if (cat.includes('marmita') || nome.includes('marmita')) {
    return imgMarmitaPicanha;
  }

  // 6. Porções
  if (cat.includes('porç') || cat.includes('porc') || nome.includes('porção') || nome.includes('porcao')) {
    return imgPorcaoChurrasco;
  }

  // 7. Carnes em geral
  if (cat.includes('carne')) {
    return imgCarnesGrelhadas;
  }

  // Fallback padrão
  return imgCarnesGrelhadas;
}

/**
 * Converte um arquivo de imagem para Base64 Data URL, redimensionando e comprimindo
 * para caber com folga no Firestore e carregar instantaneamente no navegador.
 */
export function processarImagemParaDataUrl(
  file: File,
  maxDim: number = 800,
  qualidade: number = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum arquivo fornecido'));
      return;
    }

    // Se for SVG, preserva como vetor puro
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Falha ao ler arquivo SVG'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Formato de leitura inválido'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Se falhar ao carregar no Image(), devolve a data URL bruta
        resolve(result);
      };
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(result);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Se for PNG transparente, tenta manter PNG ou WebP
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mime, qualidade);
          resolve(dataUrl);
        } catch {
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
