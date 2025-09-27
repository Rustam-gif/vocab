import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseResult, AnalyticsData } from '../types';

const ANALYTICS_KEY = 'vocab_analytics';

class AnalyticsService {
  private results: ExerciseResult[] = [];

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
      if (stored) {
        this.results = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      this.results = [];
    }
  }

  private async saveResults() {
    try {
      await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(this.results));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  async recordResult(result: ExerciseResult) {
    this.results.push(result);
    await this.saveResults();
  }

  getAnalyticsData(): AnalyticsData {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter results from last 30 days
    const recentResults = this.results.filter(
      result => new Date(result.timestamp) >= thirtyDaysAgo
    );

    // Calculate accuracy by exercise type
    const accuracyByType: Record<string, number> = {};
    const exerciseTypes = [...new Set(recentResults.map(r => r.exerciseType))];
    
    exerciseTypes.forEach(type => {
      const typeResults = recentResults.filter(r => r.exerciseType === type);
      const correctCount = typeResults.filter(r => r.correct).length;
      accuracyByType[type] = typeResults.length > 0 
        ? Math.round((correctCount / typeResults.length) * 100) 
        : 0;
    });

    // Calculate accuracy trend (last 7 days)
    const accuracyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayResults = recentResults.filter(
        result => {
          const resultDate = new Date(result.timestamp);
          return resultDate >= dayStart && resultDate < dayEnd;
        }
      );
      
      const dayAccuracy = dayResults.length > 0 
        ? Math.round((dayResults.filter(r => r.correct).length / dayResults.length) * 100)
        : 0;
      
      accuracyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        accuracy: dayAccuracy,
      });
    }

    // Calculate overall accuracy
    const totalCorrect = recentResults.filter(r => r.correct).length;
    const overallAccuracy = recentResults.length > 0 
      ? Math.round((totalCorrect / recentResults.length) * 100)
      : 0;

    // Calculate streak (consecutive days with at least one correct answer)
    let streak = 0;
    const uniqueDays = [...new Set(
      recentResults.map(r => 
        new Date(r.timestamp).toISOString().split('T')[0]
      )
    )].sort().reverse();

    for (const day of uniqueDays) {
      const dayResults = recentResults.filter(
        r => new Date(r.timestamp).toISOString().split('T')[0] === day
      );
      if (dayResults.some(r => r.correct)) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate personal best (highest single-day accuracy)
    const dailyAccuracy: Record<string, number> = {};
    recentResults.forEach(result => {
      const day = new Date(result.timestamp).toISOString().split('T')[0];
      if (!dailyAccuracy[day]) {
        dailyAccuracy[day] = 0;
      }
    });

    Object.keys(dailyAccuracy).forEach(day => {
      const dayResults = recentResults.filter(
        r => new Date(r.timestamp).toISOString().split('T')[0] === day
      );
      const correctCount = dayResults.filter(r => r.correct).length;
      dailyAccuracy[day] = dayResults.length > 0 
        ? Math.round((correctCount / dayResults.length) * 100)
        : 0;
    });

    const personalBest = Math.max(...Object.values(dailyAccuracy), 0);

    return {
      accuracyByType,
      accuracyTrend,
      overallAccuracy,
      streak,
      personalBest,
    };
  }

  getExerciseStats() {
    const totalExercises = this.results.length;
    const correctExercises = this.results.filter(r => r.correct).length;
    const totalScore = this.results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalExercises > 0 ? totalScore / totalExercises : 0;

    return {
      totalExercises,
      correctExercises,
      totalScore,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  }

  clearData() {
    this.results = [];
    return this.saveResults();
  }
}

export const analyticsService = new AnalyticsService();
