/**
 * Theme Configuration for ZenTiles
 * Each theme represents a contemplative tradition with associated visuals and audio
 */

export const THEMES = {
    india: {
        id: 'india',
        name: 'Mandala',
        description: '',
        colors: {
            primary: '#D4A574',
            secondary: '#8B4513',
            accent: '#FFD700',
            text: '#2C1810',
            textLight: '#F5E6D3',
            overlay: 'rgba(44, 24, 16, 0.35)',
            cardBg: 'rgba(212, 165, 116, 0.15)',
            cardBorder: 'rgba(212, 165, 116, 0.3)',
            // Game piece colors with high contrast
            boardBg: 'rgba(62, 39, 25, 0.85)',
            cellEmpty: 'rgba(245, 230, 211, 0.25)',
            cellFilled: '#D4A574',
            cellBorder: 'rgba(139, 69, 19, 0.6)',
            pieceColors: ['#E8B87D', '#C68B4D', '#FFD700', '#F4A460']
        },
        backgrounds: [
            { url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1920&q=80', alt: 'Taj Mahal at dawn' },
            { url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=80', alt: 'Kerala backwaters' },
            { url: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=1920&q=80', alt: 'Tea plantations' },
            { url: 'https://images.unsplash.com/photo-1585136917228-959814df0792?auto=format&fit=crop&w=1920&q=80', alt: 'Rice terraces India' }
        ],
        audio: {
            tracks: [
                { name: 'Meditation Music', url: './assets/audio/meditation-yoga-relaxing-music.mp3', duration: 300 },
                { name: 'River & Birds', url: './assets/audio/river_and_birds.mp3', duration: 60 }
            ]
        },
        transitionDuration: 15000
    },

    japan: {
        id: 'japan',
        name: 'Zen',
        description: '',
        colors: {
            primary: '#C41E3A',
            secondary: '#2D4A3E',
            accent: '#F5F5DC',
            text: '#1A1A2E',
            textLight: '#F8F8F8',
            overlay: 'rgba(26, 26, 46, 0.40)',
            cardBg: 'rgba(45, 74, 62, 0.2)',
            cardBorder: 'rgba(196, 30, 58, 0.3)',
            // Game piece colors with high contrast
            boardBg: 'rgba(26, 26, 46, 0.85)',
            cellEmpty: 'rgba(248, 248, 248, 0.2)',
            cellFilled: '#C41E3A',
            cellBorder: 'rgba(45, 74, 62, 0.7)',
            pieceColors: ['#C41E3A', '#E85D75', '#FFB7C5', '#8B2252']
        },
        backgrounds: [
            { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1920&q=80&blur=50', alt: 'Zen garden' },
            { url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1920&q=80&blur=50', alt: 'Bamboo forest' },
            { url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1920&q=80&blur=50', alt: 'Cherry blossoms' },
            { url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1920&q=80&blur=50', alt: 'Mount Fuji' }
        ],
        audio: {
            tracks: [
                { name: 'Lunar New Year', url: './assets/audio/lunar_new_year.mp3', duration: 180 },
                { name: 'Meditation Music', url: './assets/audio/meditation-yoga-relaxing-music.mp3', duration: 300 }
            ]
        },
        transitionDuration: 18000
    },

    celtic: {
        id: 'celtic',
        name: 'Pixie',
        description: '',
        colors: {
            primary: '#228B22',
            secondary: '#4A5568',
            accent: '#C0C0C0',
            text: '#1A2F1A',
            textLight: '#E8F5E8',
            overlay: 'rgba(26, 47, 26, 0.40)',
            cardBg: 'rgba(34, 139, 34, 0.15)',
            cardBorder: 'rgba(34, 139, 34, 0.3)',
            // Game piece colors with high contrast
            boardBg: 'rgba(26, 47, 36, 0.85)',
            cellEmpty: 'rgba(232, 245, 232, 0.2)',
            cellFilled: '#228B22',
            cellBorder: 'rgba(74, 85, 104, 0.6)',
            pieceColors: ['#228B22', '#32CD32', '#90EE90', '#006400']
        },
        backgrounds: [
            { url: 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&w=1920&q=80&blur=50', alt: 'Misty hills' },
            { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80&blur=50', alt: 'Forest light' },
            { url: 'https://images.unsplash.com/photo-1518173946687-a4c036bc9e89?auto=format&fit=crop&w=1920&q=80&blur=50', alt: 'Green valley' },
            { url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80&blur=50', alt: 'Mountain lake' }
        ],
        audio: {
            tracks: [
                { name: 'River & Birds', url: './assets/audio/river_and_birds.mp3', duration: 60 },
                { name: 'Sea Waves', url: './assets/audio/sea_waves.mp3', duration: 120 }
            ]
        },
        transitionDuration: 20000
    },

    nativeAmerican: {
        id: 'nativeAmerican',
        name: 'Aztlan',
        description: '',
        colors: {
            primary: '#CD853F',
            secondary: '#8B4513',
            accent: '#40E0D0',
            text: '#3D2314',
            textLight: '#FFF8DC',
            overlay: 'rgba(61, 35, 20, 0.40)',
            cardBg: 'rgba(205, 133, 63, 0.15)',
            cardBorder: 'rgba(205, 133, 63, 0.3)',
            // Game piece colors with high contrast
            boardBg: 'rgba(61, 35, 20, 0.85)',
            cellEmpty: 'rgba(255, 248, 220, 0.2)',
            cellFilled: '#CD853F',
            cellBorder: 'rgba(139, 69, 19, 0.6)',
            pieceColors: ['#CD853F', '#DEB887', '#E07020', '#8B4513']
        },
        backgrounds: [
            { url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=80', alt: 'Desert road landscape' },
            { url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1920&q=80', alt: 'Prairie grassland' },
            { url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1920&q=80', alt: 'Starry night sky' },
            { url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=80', alt: 'Red rock desert' }
        ],
        audio: {
            tracks: [
                { name: 'Sea Waves', url: './assets/audio/sea_waves.mp3', duration: 120 },
                { name: 'Meditation Music', url: './assets/audio/meditation-yoga-relaxing-music.mp3', duration: 300 }
            ]
        },
        transitionDuration: 17000
    }
};

export const DEFAULT_THEME = 'japan';

export const AUDIO_CONFIG = {
    fadeInDuration: 2000,
    fadeOutDuration: 2000,
    crossfadeDuration: 3000,
    defaultVolume: 0.3
};

export const BACKGROUND_CONFIG = {
    transitionDuration: 2000,
    preloadCount: 2
};
