/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

// Dropin Tools
import { loadCSS } from '../../scripts/aem.js';
import {
  fetchWhatsAppConfig,
  shouldHideOnThisPage as checkShouldHide,
  normalizeIconPosition,
} from '../../scripts/whatsapp-config.js';

// Cargar estilos del bloque (evita CSS inline y respeta CSP)
loadCSS('/blocks/whatsapp-contact/whatsapp-contact.css');

export default async function decorate(block) {
  if (checkShouldHide()) {
    block.remove();
    return;
  }

  // Obtener configuración desde GraphQL (si está disponible)
  const graphqlConfig = await fetchWhatsAppConfig();

  // Fallback: usar data-attributes o texto del autor si GraphQL no tiene datos
  const fallbackPhone = (block.dataset.phone || block.textContent || '').replace(/[^\d]/g, '');
  const fallbackMessage = block.dataset.message || '';

  // Prioridad: GraphQL > data-attributes > texto del bloque
  const phone = graphqlConfig?.phone || fallbackPhone;
  const message = graphqlConfig?.message || fallbackMessage;
  const iconPosition = graphqlConfig?.iconPosition || 'whatsapp-bottom-right';

  // Si GraphQL indica que está deshabilitado, no renderizamos
  if (graphqlConfig && graphqlConfig.enabled === false) {
    block.remove();
    return;
  }

  // Si no hay teléfono, no renderizamos (evita un link roto)
  if (!phone) {
    block.remove();
    return;
  }

  // Limpiar contenido "autorizado" original
  block.textContent = '';

  // Normalizar posición del icono (soporta valores legacy y nuevos)
  const positionClass = normalizeIconPosition(iconPosition);

  // Crear el botón
  const a = document.createElement('button');
  a.type = 'button';
  a.className = `whatsapp-fab ${positionClass}`;
  a.setAttribute('aria-label', 'Abrir chat de WhatsApp');
  a.setAttribute('aria-expanded', 'false');

  // Ícono (asset local)
  const img = document.createElement('img');
  img.src = '/icons/whatsapp.svg';
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');

  a.append(img);

  // Crear el popup
  const overlay = document.createElement('div');
  overlay.className = 'whatsapp-popup-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'whatsapp-popup-title');

  const popup = document.createElement('div');
  popup.className = 'whatsapp-popup';

  // Header del popup
  const header = document.createElement('div');
  header.className = 'whatsapp-popup-header';

  const title = document.createElement('h3');
  title.id = 'whatsapp-popup-title';
  title.className = 'whatsapp-popup-title';
  const titleIcon = document.createElement('img');
  titleIcon.src = '/icons/whatsapp.svg';
  titleIcon.alt = '';
  titleIcon.setAttribute('aria-hidden', 'true');
  title.append(titleIcon);
  title.append(document.createTextNode('Chatea con nosotros'));

  const closeBtn = document.createElement('button');
  closeBtn.className = 'whatsapp-popup-close';
  closeBtn.setAttribute('aria-label', 'Cerrar');
  closeBtn.innerHTML = '×';
  closeBtn.type = 'button';

  header.append(title);
  header.append(closeBtn);

  // Contenido del popup
  const content = document.createElement('div');
  content.className = 'whatsapp-popup-content';

  const popupMessage = document.createElement('p');
  popupMessage.className = 'whatsapp-popup-message';
  popupMessage.textContent = message || '¿Tienes alguna pregunta? Estamos aquí para ayudarte.';

  const actions = document.createElement('div');
  actions.className = 'whatsapp-popup-actions';

  const whatsappLink = document.createElement('a');
  whatsappLink.href = `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  whatsappLink.target = '_blank';
  whatsappLink.rel = 'noopener';
  whatsappLink.className = 'whatsapp-popup-link';
  const linkIcon = document.createElement('img');
  linkIcon.src = '/icons/whatsapp.svg';
  linkIcon.alt = '';
  linkIcon.setAttribute('aria-hidden', 'true');
  whatsappLink.append(linkIcon);
  whatsappLink.append(document.createTextNode('Abrir WhatsApp'));

  actions.append(whatsappLink);
  content.append(popupMessage);
  content.append(actions);

  popup.append(header);
  popup.append(content);
  overlay.append(popup);

  // Funcionalidad de abrir/cerrar
  const openPopup = () => {
    overlay.classList.add('active');
    a.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const closePopup = () => {
    overlay.classList.remove('active');
    a.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    a.focus();
  };

  a.addEventListener('click', (e) => {
    e.preventDefault();
    openPopup();
  });

  closeBtn.addEventListener('click', closePopup);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closePopup();
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closePopup();
    }
  });

  // Inyectar en el body para asegurar stacking y posición fija
  const wrapper = document.createElement('div');
  wrapper.className = 'whatsapp'; // scope de estilos del bloque
  wrapper.append(a);
  wrapper.append(overlay);

  // Si el block quedó en header/footer, lo reemplazamos por el wrapper
  block.replaceWith(wrapper);
}
