/**
 * Centralized Application State Store
 * Manages active tab, selected scenario, analysis results, and active session
 */
import { getScenarioById, PRESET_SCENARIOS } from '../../data/scenarios/scenarios-data.js';

export class AppState {
  constructor() {
    this.activeTab = localStorage.getItem('netarchitect_tab') || 'architect'; // 'knowledge' | 'architect' | 'errors'
    this.selectedProfileId = 'campus-lan';
    this.currentScenario = getScenarioById('campus-lan');
    this.architectStage = 'selection'; // 'selection' | 'review' | 'results' | 'export'
    this.analysisResult = null;
    this.diagnostics = [];
    this.isAnalyzing = false;
    this.sessionDrawerOpen = false;
    this.activeSessionId = null;
    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  setTab(tab) {
    this.activeTab = tab;
    localStorage.setItem('netarchitect_tab', tab);
    this.notify();
  }

  selectScenario(profileId) {
    this.selectedProfileId = profileId;
    this.currentScenario = getScenarioById(profileId);
    this.architectStage = 'review';
    this.analysisResult = null;
    this.notify();
  }

  resetCurrentScenario() {
    this.currentScenario = getScenarioById(this.selectedProfileId);
    this.analysisResult = null;
    this.notify();
  }

  setStage(stage) {
    this.architectStage = stage;
    this.notify();
  }

  setAnalysisResult(result) {
    this.analysisResult = result;
    if (result && result.diagnostics) {
      this.diagnostics = result.diagnostics;
    }
    this.architectStage = result && result.status === 'success' ? 'results' : 'review';
    this.notify();
  }

  toggleSessionDrawer(forceState = null) {
    this.sessionDrawerOpen = forceState !== null ? forceState : !this.sessionDrawerOpen;
    this.notify();
  }
}

export const appState = new AppState();

