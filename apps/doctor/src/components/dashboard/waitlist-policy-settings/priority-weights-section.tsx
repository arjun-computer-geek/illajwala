'use client';

import React from 'react';
import { Input, Label } from '@illajwala/ui';
import { Info } from 'lucide-react';

type PriorityWeights = {
  waitTime?: number;
  membershipLevel?: number;
  chronicCondition?: number;
};

type PriorityWeightsSectionProps = {
  weights: PriorityWeights;
  onChange: (weights: PriorityWeights) => void;
};

const DEFAULT_WEIGHTS = {
  waitTime: 1.0,
  membershipLevel: 0.5,
  chronicCondition: 0.3,
};

export const PriorityWeightsSection = React.memo(
  ({ weights, onChange }: PriorityWeightsSectionProps) => {
    const handleWeightChange = (key: keyof PriorityWeights, value: string) => {
      const numValue = parseFloat(value) || 0;
      onChange({
        ...weights,
        [key]: numValue,
      });
    };

    return (
      <div className="space-y-4 rounded-lg border border-border bg-background/40 p-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold">Priority Scoring Weights</Label>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          Adjust how different factors contribute to waitlist priority. Higher weights = higher
          priority.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="weight-waitTime" className="text-xs">
              Wait Time
            </Label>
            <Input
              id="weight-waitTime"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={weights.waitTime ?? DEFAULT_WEIGHTS.waitTime}
              onChange={(e) => handleWeightChange('waitTime', e.target.value)}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">Default: {DEFAULT_WEIGHTS.waitTime}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight-membershipLevel" className="text-xs">
              Membership Level
            </Label>
            <Input
              id="weight-membershipLevel"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={weights.membershipLevel ?? DEFAULT_WEIGHTS.membershipLevel}
              onChange={(e) => handleWeightChange('membershipLevel', e.target.value)}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Default: {DEFAULT_WEIGHTS.membershipLevel}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight-chronicCondition" className="text-xs">
              Chronic Condition
            </Label>
            <Input
              id="weight-chronicCondition"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={weights.chronicCondition ?? DEFAULT_WEIGHTS.chronicCondition}
              onChange={(e) => handleWeightChange('chronicCondition', e.target.value)}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Default: {DEFAULT_WEIGHTS.chronicCondition}
            </p>
          </div>
        </div>
      </div>
    );
  },
);

PriorityWeightsSection.displayName = 'PriorityWeightsSection';
