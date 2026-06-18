(function() {
  // Конфиг
  const CONFIG = {
    apiEndpoint: '/api/chat',
    welcomeMessages: {
      de: 'Hallo! Ich bin der Assistent von KSK Farmos. Wie kann ich Ihnen helfen?',
      en: 'Hello! I\'m the KSK Farmos assistant. How can I help you?',
      ru: 'Здравствуйте! Я ассистент KSK Farmos. Чем могу помочь?',
      tr: 'Merhaba! KSK Farmos asistanıyım. Size nasıl yardımcı olabilirim?',
      pl: 'Dzień dobry! Jestem asystentem KSK Farmos. Jak mogę pomóc?',
      ar: 'مرحباً! أنا مساعد KSK Farmos. كيف يمكنني مساعدتك؟',
      uk: 'Вітаю! Я асистент KSK Farmos. Чим можу допомогти?'
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
  let currentLang = document.documentElement.lang || 'de'

  // Получить приветствие на текущем языке
  function getWelcome() {
    return CONFIG.welcomeMessages[currentLang] || CONFIG.welcomeMessages.de
  }

  // Получить быстрые ответы
  function getQuickReplies() {
    return CONFIG.quickReplies[currentLang] || CONFIG.quickReplies.de
  }

  // Создать HTML виджета
  function createWidget() {
    const widget = document.createElement('div')
    widget.id = 'ksk-chat'
    widget.innerHTML = `
      <button class="ksk-chat-btn" id="kskChatBtn" aria-label="Chat öffnen">
        <span class="ksk-chat-btn-inner">
          <svg class="ksk-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <svg class="ksk-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
        <span class="ksk-unread" id="kskUnread" style="display:none">1</span>
      </button>

      <div class="ksk-chat-window" id="kskWindow" style="display:none">
        <div class="ksk-chat-header">
          <div class="ksk-chat-header-info">
            <div class="ksk-chat-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <div>
              <div class="ksk-chat-name">KSK Farmos Assistent</div>
              <div class="ksk-chat-status">
                <span class="ksk-status-dot"></span>
                Online
              </div>
            </div>
          </div>
          <button class="ksk-chat-close" onclick="kskChat.close()" aria-label="Schließen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="ksk-chat-messages" id="kskMessages">
          <div class="ksk-msg ksk-msg-bot">
            <div class="ksk-msg-bubble">${getWelcome()}</div>
          </div>
          <div class="ksk-quick-replies" id="kskQuick">
            ${getQuickReplies().map(r => `<button class="ksk-quick-btn" onclick="kskChat.send('${r}')">${r}</button>`).join('')}
          </div>
        </div>

        <div class="ksk-chat-input-wrap">
          <input
            type="text"
            class="ksk-chat-input"
            id="kskInput"
            placeholder="Ihre Frage..."
            onkeydown="if(event.key==='Enter')kskChat.send()"
            maxlength="500"
          >
          <button class="ksk-chat-send" onclick="kskChat.send()" aria-label="Senden">
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

  // Добавить сообщение в чат
  function addMessage(text, isBot) {
    const messagesEl = document.getElementById('kskMessages')
    const div = document.createElement('div')
    div.className = `ksk-msg ${isBot ? 'ksk-msg-bot' : 'ksk-msg-user'}`
    
    let formattedText = text.replace(/\n/g, '<br>')
    if (isBot) {
      // Регулярное выражение для поиска markdown-ссылок [Text](URL)
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      formattedText = formattedText.replace(markdownLinkRegex, (match, linkText, url) => {
        const isExternal = url.startsWith('http') || url.startsWith('tel:') || url.startsWith('mailto:')
        const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${url}" class="ksk-chat-link-btn" ${target}>${linkText}</a>`
      })
    }

    div.innerHTML = `<div class="ksk-msg-bubble">${formattedText}</div>`
    messagesEl.appendChild(div)
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  // Показать лоадер
  function showLoader() {
    const messagesEl = document.getElementById('kskMessages')
    const div = document.createElement('div')
    div.className = 'ksk-msg ksk-msg-bot ksk-loader-wrap'
    div.id = 'kskLoader'
    div.innerHTML = `
      <div class="ksk-msg-bubble ksk-loader">
        <span></span><span></span><span></span>
      </div>
    `
    messagesEl.appendChild(div)
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  // Убрать лоадер
  function hideLoader() {
    const loader = document.getElementById('kskLoader')
    if (loader) loader.remove()
  }

  // Отправить сообщение
  async function sendMessage(text) {
    if (!text || isLoading) return

    // Убрать быстрые ответы после первого сообщения
    const quick = document.getElementById('kskQuick')
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
        addMessage('Entschuldigung, ein Fehler ist aufgetreten. Bitte rufen Sie uns an: 05693 / 9189907', true)
      }
    } catch (error) {
      hideLoader()
      addMessage('Entschuldigung, ein Fehler ist aufgetreten. Bitte rufen Sie uns an: 05693 / 9189907', true)
    }

    isLoading = false
  }

  // Публичный API
  window.kskChat = {
    open() {
      isOpen = true
      document.getElementById('kskWindow').style.display = 'flex'
      document.querySelector('.ksk-icon-chat').style.display = 'none'
      document.querySelector('.ksk-icon-close').style.display = 'block'
      document.getElementById('kskUnread').style.display = 'none'
    },
    close() {
      isOpen = false
      document.getElementById('kskWindow').style.display = 'none'
      document.querySelector('.ksk-icon-chat').style.display = 'block'
      document.querySelector('.ksk-icon-close').style.display = 'none'
    },
    toggle() {
      isOpen ? this.close() : this.open()
    },
    send(text) {
      const input = document.getElementById('kskInput')
      const msg = text || input.value.trim()
      if (!msg) return
      input.value = ''
      sendMessage(msg)
    }
  }

  // Инициализация
  document.addEventListener('DOMContentLoaded', () => {
    createWidget()
    document.getElementById('kskChatBtn').addEventListener('click', () => kskChat.toggle())

    // Показать при первом скролле
    const showChatOnScroll = () => {
      if (window.scrollY > 20) {
        const widget = document.getElementById('ksk-chat')
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
        document.getElementById('kskUnread').style.display = 'flex'
      }
    }, 3000)

    // Синхронизировать язык с lang-switcher сайта
    const observer = new MutationObserver(() => {
      currentLang = document.documentElement.lang || 'de'
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  })
})()
