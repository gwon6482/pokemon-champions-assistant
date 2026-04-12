/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // 포켓몬 타입 색상
        type: {
          normal:   '#A8A878',
          fire:     '#F08030',
          water:    '#6890F0',
          electric: '#F8D030',
          grass:    '#78C850',
          ice:      '#98D8D8',
          fighting: '#C03028',
          poison:   '#A040A0',
          ground:   '#E0C068',
          flying:   '#A890F0',
          psychic:  '#F85888',
          bug:      '#A8B820',
          rock:     '#B8A038',
          ghost:    '#705898',
          dragon:   '#7038F8',
          dark:     '#705848',
          steel:    '#B8B8D0',
          fairy:    '#EE99AC',
        },
        // 앱 테마
        surface: {
          900: '#0f1117',
          800: '#1a1d27',
          700: '#242836',
          600: '#2e3345',
        }
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'system-ui', 'sans-serif']
      },
      animation: {
        'bounce-once': 'bounce 0.5s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
