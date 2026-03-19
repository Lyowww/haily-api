import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';

export interface OnboardingOption {
  id: string;
  label: string;
  value: string;
}

export interface OnboardingQuestion {
  id: string;
  title: string;
  type:
    | 'style_preference'
    | 'color_preference'
    | 'occasion_preference'
    | 'climate_sensitivity'
    | 'fit_preference';
  options: OnboardingOption[];
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'style_preference',
    title: 'Which core style best represents your wardrobe?',
    type: 'style_preference',
    options: [
      { id: 'minimal_clean', label: 'Minimal / clean', value: 'minimal_clean' },
      { id: 'classic_tailored', label: 'Classic / tailored', value: 'classic_tailored' },
      { id: 'casual_everyday', label: 'Casual everyday', value: 'casual_everyday' },
      { id: 'street_trendy', label: 'Street / trendy', value: 'street_trendy' },
      { id: 'elegant_feminine', label: 'Elegant / feminine', value: 'elegant_feminine' },
    ],
  },
  {
    id: 'color_preference',
    title: 'Which color palette do you wear most?',
    type: 'color_preference',
    options: [
      { id: 'monochrome', label: 'Black / white / gray', value: 'monochrome' },
      { id: 'neutral_warm', label: 'Warm neutrals (beige, camel, brown)', value: 'neutral_warm' },
      { id: 'earthy_muted', label: 'Earthy muted (olive, rust, khaki)', value: 'earthy_muted' },
      { id: 'cool_neutrals', label: 'Cool neutrals (navy, charcoal, denim)', value: 'cool_neutrals' },
      { id: 'bold_pop', label: 'Bold pops of color', value: 'bold_pop' },
    ],
  },
  {
    id: 'occasion_preference',
    title: 'What is your most frequent dressing context?',
    type: 'occasion_preference',
    options: [
      { id: 'daily_errands', label: 'Everyday / errands', value: 'daily_errands' },
      { id: 'office_business', label: 'Office / business', value: 'office_business' },
      { id: 'social_evening', label: 'Social / evening', value: 'social_evening' },
      { id: 'travel_weekend', label: 'Travel / weekend', value: 'travel_weekend' },
      { id: 'active_lifestyle', label: 'Active lifestyle', value: 'active_lifestyle' },
    ],
  },
  {
    id: 'climate_sensitivity',
    title: 'For weather-based recommendations, what should AI prioritize?',
    type: 'climate_sensitivity',
    options: [
      { id: 'stay_warm', label: 'Keeping me warm', value: 'stay_warm' },
      { id: 'balanced', label: 'Balanced comfort', value: 'balanced' },
      { id: 'stay_cool', label: 'Keeping me cool', value: 'stay_cool' },
      { id: 'layer_friendly', label: 'Layer-friendly outfits', value: 'layer_friendly' },
    ],
  },
  {
    id: 'fit_preference',
    title: 'Which silhouette fit do you prefer most?',
    type: 'fit_preference',
    options: [
      { id: 'tailored', label: 'Tailored / close fit', value: 'tailored' },
      { id: 'regular', label: 'Regular / balanced', value: 'regular' },
      { id: 'relaxed', label: 'Relaxed', value: 'relaxed' },
      { id: 'oversized', label: 'Oversized / loose', value: 'oversized' },
    ],
  },
];

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  getQuestions() {
    return {
      questions: ONBOARDING_QUESTIONS.slice(0, 5),
    };
  }

  async saveAnswers(
    userId: string,
    answers: Array<{ questionId: string; selectedOptionId: string }>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tasteProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const seen = new Set<string>();
    const tasteProfile: Record<string, any> = {};

    for (const answer of answers) {
      if (seen.has(answer.questionId)) {
        throw new BadRequestException(
          `Duplicate answer for question "${answer.questionId}"`,
        );
      }
      seen.add(answer.questionId);

      const question = ONBOARDING_QUESTIONS.find(
        (item) => item.id === answer.questionId,
      );
      if (!question) {
        throw new BadRequestException(
          `Unknown question "${answer.questionId}"`,
        );
      }

      const option = question.options.find(
        (item) => item.id === answer.selectedOptionId,
      );
      if (!option) {
        throw new BadRequestException(
          `Unknown option "${answer.selectedOptionId}" for question "${answer.questionId}"`,
        );
      }

      tasteProfile[question.id] = {
        questionId: question.id,
        questionType: question.type,
        selectedOptionId: option.id,
        label: option.label,
        value: option.value,
      };
    }

    const mergedTasteProfile = {
      ...(user.tasteProfile && typeof user.tasteProfile === 'object'
        ? (user.tasteProfile as Record<string, any>)
        : {}),
      ...tasteProfile,
    };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        tasteProfile: mergedTasteProfile,
        onboardingStatus: 'completed',
        onboardingCompletedAt: new Date(),
      },
      select: {
        id: true,
        onboardingStatus: true,
        tasteProfile: true,
        onboardingCompletedAt: true,
      },
    });

    return {
      message: 'Onboarding answers saved successfully',
      profile: updatedUser,
    };
  }
}
