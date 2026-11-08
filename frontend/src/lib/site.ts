// Contenu de la page d'accueil.
// À REMPLACER par les vraies informations avant la présentation.

export const SITE = {
  name: 'Auto-école Teranga',
  phone: '+221 704753865',
  email: 'pmbacke73@gmail.com',
  address: 'Avenue Charle Degaule, Dakar , Senegal',
  hours: 'Du lundi au samedi, de 8 h à 18 h',

  // Carrousel d'ouverture : les photos sont dans frontend/public/images.
  // Si une photo est absente, le dégradé "fallback" s'affiche à la place.
  slides: [
    {
      image: '/images/slide-1.jpg',
      fallback: 'linear-gradient(135deg,#0a1a4a,#1d4ed8)',
      title: 'Réservez votre leçon en ligne',
      text: 'Choisissez votre moniteur et un créneau libre en quelques secondes.',
    },
    {
      image: '/images/slide-2.jpg',
      fallback: 'linear-gradient(135deg,#0a1a4a,#0e7490)',
      title: 'Un moniteur à votre rythme',
      text: 'Des leçons d’une heure, avec un véhicule attribué à chaque réservation.',
    },
    {
      image: '/images/slide-3.jpg',
      fallback: 'linear-gradient(135deg,#1e1b4b,#4338ca)',
      title: 'Suivez vos progrès leçon après leçon',
      text: 'Votre moniteur note chaque compétence : vous voyez où vous en êtes.',
    },
    {
      image: '/images/slide-4.jpg',
      fallback: 'linear-gradient(135deg,#0a1a4a,#b45309)',
      title: 'Vos heures sous contrôle',
      text: 'Solde en temps réel et annulation gratuite jusqu’à 24 heures avant.',
    },
    {
      image: '/images/slide-5.jpg',
      fallback: 'linear-gradient(135deg,#0a1a4a,#047857)',
      title: 'Prêt pour le jour de l’examen',
      text: 'Du code à la route, une seule plateforme pour toute votre formation.',
    },
  ],

  // CHIFFRES D'EXEMPLE : remplacez-les par les vrais chiffres de l'auto-école
  stats: [
    { value: 1200, suffix: '+', label: 'élèves formés' },
    { value: 92, suffix: ' %', label: 'de réussite au permis' },
    { value: 15, suffix: ' ans', label: 'd’expérience' },
    { value: 12, suffix: '', label: 'moniteurs diplômés' },
  ],

  // AVIS D'EXEMPLE : remplacez-les par de vrais avis d'élèves (avec leur accord)
  testimonials: [
    {
      text: 'J’ai réservé mes leçons depuis mon téléphone, sans jamais appeler l’agence. Mon moniteur était toujours ponctuel.',
      name: 'Awa D.',
      detail: 'Permis obtenu du premier coup',
    },
    {
      text: 'Le carnet de progression m’a montré exactement ce que je devais retravailler avant l’examen.',
      name: 'Moussa F.',
      detail: 'Élève en préparation',
    },
    {
      text: 'Voir mon solde d’heures et pouvoir annuler facilement, c’est ce qui m’a convaincu.',
      name: 'Fatou B.',
      detail: 'Permis obtenu',
    },
  ],

  // Forfaits d'heures de conduite (prix en FCFA, exemples à remplacer)
  packages: [
    {
      hours: 10,
      price: 60000,
      description: 'Pour reprendre le volant ou compléter une formation.',
    },
    {
      hours: 20,
      price: 150000,
      description: 'Le forfait le plus choisi pour préparer le permis.',
    },
    {
      hours: 30,
      price: 200000,
      description: 'Pour apprendre à votre rythme, avec une marge de sécurité.',
    },
  ],
};