import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OnboardingService } from './onboarding.service';

class OnboardingAnswerDto {
  @ApiProperty({ example: 'style_preference' })
  @IsString()
  questionId!: string;

  @ApiProperty({ example: 'casual' })
  @IsString()
  selectedOptionId!: string;
}

class SaveOnboardingAnswersDto {
  @ApiProperty({ type: [OnboardingAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingAnswerDto)
  answers!: OnboardingAnswerDto[];
}

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('questions')
  @ApiOperation({ summary: 'Get onboarding taste-profile questions' })
  @ApiResponse({ status: 200, description: 'Returns up to five questions' })
  getQuestions() {
    return this.onboardingService.getQuestions();
  }

  @Post('answers')
  @ApiOperation({ summary: 'Save onboarding answers for the current user' })
  @ApiResponse({ status: 201, description: 'Answers saved successfully' })
  saveAnswers(@Request() req: any, @Body() dto: SaveOnboardingAnswersDto) {
    return this.onboardingService.saveAnswers(req.user.userId, dto.answers);
  }
}
