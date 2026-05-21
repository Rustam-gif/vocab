# Engniter Vocabulary Learning App

Engniter is a React Native vocabulary learning app focused on active recall, spaced repetition, and learner progress tracking. The project combines a mobile learning product with analytics-ready data structures for tracking vocabulary mastery, review behavior, weak words, streaks, and exercise performance.

## Why this project matters

This repository is useful as a portfolio project because it is more than a simple UI app. It shows how a real learning product can collect structured learner activity and turn that activity into feedback, review scheduling, and progress insights.

The project demonstrates:

- Mobile app development with React Native and TypeScript
- Spaced repetition state management inspired by SM-2
- Learner analytics such as accuracy trends, weak words, streaks, and review health
- Persistent local state with AsyncStorage and app lifecycle handling
- Personalized onboarding, reminders, sound, and premium-status flows
- Type-safe domain models for words, exercises, quizzes, stories, and learning progress

## Core features

- Vocabulary saving with definitions, examples, phonetics, notes, tags, and folders
- Multiple exercise types including recall, multiple choice, synonym, usage, and letter-based practice
- Per-word practice statistics: attempts, correct answers, mistakes, score, and mastery state
- Spaced repetition metadata: ease factor, interval, repetitions, due dates, and lapses
- Analytics snapshots for accuracy, streaks, weak words, tag performance, time trends, and SRS health
- Personalized onboarding and language preference storage
- Background persistence and app state handling for reliable mobile use

## Tech stack

- React Native
- TypeScript
- Zustand
- AsyncStorage
- Supabase client
- React Native SVG
- Lottie / Rive animations
- Push notifications
- Text-to-speech and sound support

## Data science angle

The app already captures the kind of behavioral data that can support data science projects. Useful next extensions include:

- Predicting which words a learner is likely to forget
- Ranking weak words by mistake rate and review delay
- Building a spaced-repetition recommendation engine
- Creating learner cohorts based on activity and retention patterns
- Forecasting vocabulary growth over time
- Designing dashboards for accuracy, retention, streaks, and review workload

## Possible analytics pipeline

```text
User practice events
        |
        v
Exercise results + word metadata
        |
        v
Feature engineering
        |
        v
Retention / weak-word model
        |
        v
Personalized review recommendations
```

## Getting started

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run ios
```

or:

```bash
npm run android
```

Run the daily mission test:

```bash
npm run test:daily
```

## Portfolio roadmap

Planned improvements for making this repository stronger as a data science portfolio project:

- Add a small sample dataset of anonymized practice events
- Build a notebook for weak-word analysis and retention modeling
- Add charts for learner progress and review workload
- Create a Streamlit dashboard using exported practice data
- Document model metrics and recommendations clearly in this README

## Repository status

This is an active learning-product project. The current codebase focuses on the mobile app foundation and domain models; the next portfolio step is to add reproducible analytics notebooks and dashboards on top of the app data.