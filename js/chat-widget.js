(function() {
  // Конфиг
  const CONFIG = {
    apiEndpoint: '/api/chat',
    welcomeMessages: {
      de: 'Hallo! Ich bin der KI-Assistent von Amour Total Care Home. Wie kann ich Ihnen helfen?',
      en: 'Hello! I\'m the Amour Total Care Home assistant. How can I help you?',
      ru: 'Здравствуйте! Я ассистент Amour Total Care Home. Чем могу помочь?',
      tr: 'Merhaba! Amour Total Care Home asistanıyım. Size nasıl yardımcı olabilirim?',
      pl: 'Dzień dobry! Jestem asystentem Amour Total Care Home. Jak mogę pomóc?',
      ar: 'مرحباً! أنا مساعد Amour Total Care Home. كيف يمكنني مساعدتك؟',
      uk: 'Вітаю! Я асистент Amour Total Care Home. Чим можу допомогти?'
    },
    quickReplies: {
      de: ['Kostenübernahme?', 'Standorte?', 'Karriere?', 'Beratung anfragen'],
      ru: ['Кто платит?', 'Адреса?', 'Вакансии?', 'Консультация'],
      en: ['Who pays?', 'Locations?', 'Careers?', 'Free consultation']
    }
  }

  let messages = []
  let isOpen = false
  let isLoading = false
  let currentLang = document.documentElement.lang || 'en'

  // Получить приветствие на текущем языке
  function getWelcome() {
    return CONFIG.welcomeMessages[currentLang] || CONFIG.welcomeMessages.en
  }

  // Получить быстрые ответы
  function getQuickReplies() {
    return CONFIG.quickReplies[currentLang] || CONFIG.quickReplies.en
  }

  // Создать HTML виджета
  function createWidget() {
    const widget = document.createElement('div')
    widget.id = 'amour-chat'
    widget.innerHTML = `
      <button class="amour-chat-btn" id="amourChatBtn" aria-label="Open chat">
        <span class="amour-chat-btn-inner">
          <svg class="amour-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <svg class="amour-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
        <span class="amour-unread" id="amourUnread" style="display:none">1</span>
      </button>

      <div class="amour-chat-window" id="amourWindow" style="display:none">
        <div class="amour-chat-header">
          <div class="amour-chat-header-info">
            <div class="amour-chat-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <div>
              <div class="amour-chat-name">Amour Total Care Home Assistant</div>
              <div class="amour-chat-status">
                <span class="amour-status-dot"></span>
                Online
              </div>
            </div>
          </div>
          <button class="amour-chat-close" onclick="amourChat.close()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="amour-chat-messages" id="amourMessages">
          <div class="amour-msg amour-msg-bot">
            <div class="amour-msg-bubble">${getWelcome()}</div>
          </div>
          <div class="amour-quick-replies" id="amourQuick">
            ${getQuickReplies().map(r => `<button class="amour-quick-btn" onclick="amourChat.send('${r}')">${r}</button>`).join('')}
          </div>
        </div>

        <div class="amour-chat-input-wrap">
          <input
            type="text"
            class="amour-chat-input"
            id="amourInput"
            placeholder="Your question..."
            onkeydown="if(event.key==='Enter')amourChat.send()"
            maxlength="500"
          >
          <button class="amour-chat-send" onclick="amourChat.send()" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    `
    document.body.appendChild(widget)
  }

  // Экранировать HTML-спецсимволы, чтобы пользовательский/ИИ-текст нельзя было вставить как разметку
  function escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  // Добавить сообщение в чат
  function addMessage(text, isBot) {
    const messagesEl = document.getElementById('amourMessages')
    const div = document.createElement('div')
    div.className = `amour-msg ${isBot ? 'amour-msg-bot' : 'amour-msg-user'}`

    let formattedText = escapeHtml(text).replace(/\n/g, '<br>')
    if (isBot) {
      // Регулярное выражение для поиска markdown-ссылок [Text](URL)
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      formattedText = formattedText.replace(markdownLinkRegex, (match, linkText, url) => {
        const isExternal = url.startsWith('http') || url.startsWith('tel:') || url.startsWith('mailto:')
        const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${url}" class="amour-chat-link-btn" ${target}>${linkText}</a>`
      })
    }

    div.innerHTML = `<div class="amour-msg-bubble">${formattedText}</div>`
    messagesEl.appendChild(div)
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  // Показать лоадер
  function showLoader() {
    const messagesEl = document.getElementById('amourMessages')
    const div = document.createElement('div')
    div.className = 'amour-msg amour-msg-bot amour-loader-wrap'
    div.id = 'amourLoader'
    div.innerHTML = `
      <div class="amour-msg-bubble amour-loader">
        <span></span><span></span><span></span>
      </div>
    `
    messagesEl.appendChild(div)
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  // Убрать лоадер
  function hideLoader() {
    const loader = document.getElementById('amourLoader')
    if (loader) loader.remove()
  }

  // Отправить сообщение
  async function sendMessage(text) {
    if (!text || isLoading) return

    // Убрать быстрые ответы после первого сообщения
    const quick = document.getElementById('amourQuick')
    if (quick) quick.remove()

    addMessage(text, false)
    messages.push({ role: 'user', content: text })

    isLoading = true
    showLoader()

    try {
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })

      const data = await response.json()
      hideLoader()

      if (data.message) {
        addMessage(data.message, true)
        messages.push({ role: 'assistant', content: data.message })
      } else {
        addMessage('Sorry, something went wrong. Please call us at: +91 88071 08378', true)
      }
    } catch (error) {
      hideLoader()
      addMessage('Sorry, something went wrong. Please call us at: +91 88071 08378', true)
    }

    isLoading = false
  }

  // Публичный API
  window.amourChat = {
    open() {
      isOpen = true
      document.getElementById('amourWindow').style.display = 'flex'
      document.querySelector('.amour-icon-chat').style.display = 'none'
      document.querySelector('.amour-icon-close').style.display = 'block'
      document.getElementById('amourUnread').style.display = 'none'
    },
    close() {
      isOpen = false
      document.getElementById('amourWindow').style.display = 'none'
      document.querySelector('.amour-icon-chat').style.display = 'block'
      document.querySelector('.amour-icon-close').style.display = 'none'
    },
    toggle() {
      isOpen ? this.close() : this.open()
    },
    send(text) {
      const input = document.getElementById('amourInput')
      const msg = text || input.value.trim()
      if (!msg) return
      input.value = ''
      sendMessage(msg)
    }
  }

  // Инициализация
  document.addEventListener('DOMContentLoaded', () => {
    createWidget()
    document.getElementById('amourChatBtn').addEventListener('click', () => amourChat.toggle())

    // Показать при первом скролле
    const showChatOnScroll = () => {
      if (window.scrollY > 20) {
        const widget = document.getElementById('amour-chat')
        if (widget) {
          widget.classList.add('visible')
          window.removeEventListener('scroll', showChatOnScroll)
        }
      }
    }
    window.addEventListener('scroll', showChatOnScroll, { passive: true })
    showChatOnScroll() // Вызвать сразу на случай, если страница уже прокручена при загрузке

    // Показать индикатор через 3 секунды если чат не открыт
    setTimeout(() => {
      if (!isOpen) {
        document.getElementById('amourUnread').style.display = 'flex'
      }
    }, 3000)

    // Синхронизировать язык с lang-switcher сайта
    const observer = new MutationObserver(() => {
      currentLang = document.documentElement.lang || 'en'
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  })
})()
