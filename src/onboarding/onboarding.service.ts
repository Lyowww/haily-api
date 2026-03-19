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
    title: 'Which style feels most like you?',
    type: 'style_preference',
    options: [
      { id: 'casual', label: 'Casual', value: 'casual' },
      { id: 'streetwear', label: 'Streetwear', value: 'streetwear' },
      { id: 'classic', label: 'Classic', value: 'classic' },
      { id: 'minimal', label: 'Minimal', value: 'minimal' },
      { id: 'smart_casual', label: 'Smart Casual', value: 'smart_casual' },
    ],
  },
  {
    id: 'color_preference',
    title: 'What color palette do you gravitate toward?',
    type: 'color_preference',
    options: [
      { id: 'neutral', label: 'Neutral tones', value: 'neutral' },
      { id: 'bold', label: 'Bold colors', value: 'bold' },
      { id: 'earth', label: 'Earth tones', value: 'earth' },
      { id: 'monochrome', label: 'Monochrome', value: 'monochrome' },
      { id: 'pastel', label: 'Pastels', value: 'pastel' },
    ],
  },
  {
    id: 'occasion_preference',
    title: 'What do you dress for most often?',
    type: 'occasion_preference',
    options: [
      { id: 'daily', label: 'Everyday wear', value: 'daily' },
      { id: 'work', label: 'Work', value: 'work' },
      { id: 'evening', label: 'Evenings out', value: 'evening' },
      { id: 'travel', label: 'Travel', value: 'travel' },
      { id: 'active', label: 'Active / on-the-go', value: 'active' },
    ],
  },
  {
    id: 'climate_sensitivity',
    title: 'How do you usually react to temperature?',
    type: 'climate_sensitivity',
    options: [
      { id: 'runs_cold', label: 'I get cold easily', value: 'runs_cold' },
      { id: 'balanced', label: 'I am usually comfortable', value: 'balanced' },
      { id: 'runs_warm', label: 'I run warm', value: 'runs_warm' },
      { id: 'layering', label: 'I prefer layering options', value: 'layering' },
    ],
  },
  {
    id: 'fit_preference',
    title: 'What fit do you prefer?',
    type: 'fit_preference',
    options: [
      { id: 'slim', label: 'Slim', value: 'slim' },
      { id: 'regular', label: 'Regular', value: 'regular' },
      { id: 'relaxed', label: 'Relaxed', value: 'relaxed' },
      { id: 'oversized', label: 'Oversized', value: 'oversized' },
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
