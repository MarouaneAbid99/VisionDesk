import { prisma } from '../../lib/prisma.js';
import { LensType } from '@prisma/client';

interface RecommendationInput {
  sphere?: number;
  cylinder?: number;
  axis?: number;
  add?: number;
  lensType?: LensType;
}

interface RecommendedLens {
  id: string;
  name: string;
  lensType: LensType;
  index: string | null;
  coating: string;
  salePrice: number;
  supplier: { id: string; name: string } | null;
  matchScore: number;
  matchReasons: string[];
}

export const lensRecommendationService = {
  async recommend(shopId: string, input: RecommendationInput): Promise<RecommendedLens[]> {
    const { sphere, cylinder, add, lensType } = input;

    const where: any = {
      shopId,
      isActive: true,
      quantity: { gt: 0 },
    };

    if (lensType) {
      where.lensType = lensType;
    }

    const lenses = await prisma.lens.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { salePrice: 'asc' },
    });

    const recommendations: RecommendedLens[] = [];

    for (const lens of lenses) {
      let matchScore = 50;
      const matchReasons: string[] = [];

      if (sphere !== undefined) {
        const absSpherePower = Math.abs(sphere);
        
        if (lens.minSphere !== null && lens.maxSphere !== null) {
          const minSph = Number(lens.minSphere);
          const maxSph = Number(lens.maxSphere);
          
          if (sphere >= minSph && sphere <= maxSph) {
            matchScore += 20;
            matchReasons.push('Sphere in range');
          } else {
            continue;
          }
        } else {
          if (absSpherePower <= 4) {
            if (lens.index === '1.50' || lens.index === '1.53') {
              matchScore += 15;
              matchReasons.push('Standard index suitable for low power');
            }
          } else if (absSpherePower <= 6) {
            if (lens.index === '1.60' || lens.index === '1.67') {
              matchScore += 20;
              matchReasons.push('Mid-high index recommended for medium power');
            } else if (lens.index === '1.50' || lens.index === '1.53') {
              matchScore += 5;
              matchReasons.push('Standard index (thicker lens expected)');
            }
          } else {
            if (lens.index === '1.67' || lens.index === '1.74') {
              matchScore += 25;
              matchReasons.push('High index recommended for high power');
            } else if (lens.index === '1.60') {
              matchScore += 10;
              matchReasons.push('Mid-high index (consider higher)');
            }
          }
        }
      }

      if (cylinder !== undefined) {
        const absCylPower = Math.abs(cylinder);
        
        if (lens.minCylinder !== null && lens.maxCylinder !== null) {
          const minCyl = Number(lens.minCylinder);
          const maxCyl = Number(lens.maxCylinder);
          
          if (cylinder >= minCyl && cylinder <= maxCyl) {
            matchScore += 15;
            matchReasons.push('Cylinder in range');
          } else {
            continue;
          }
        } else {
          if (absCylPower > 2) {
            if (lens.index === '1.60' || lens.index === '1.67' || lens.index === '1.74') {
              matchScore += 10;
              matchReasons.push('Higher index helps with astigmatism');
            }
          }
        }
      }

      if (add !== undefined && add > 0) {
        if (lens.maxAdd !== null) {
          const maxAddValue = Number(lens.maxAdd);
          if (add <= maxAddValue) {
            matchScore += 10;
            matchReasons.push('Add power supported');
          } else {
            continue;
          }
        }

        if (lens.lensType === 'PROGRESSIVE') {
          matchScore += 20;
          matchReasons.push('Progressive lens for reading addition');
        } else if (lens.lensType === 'BIFOCAL') {
          matchScore += 15;
          matchReasons.push('Bifocal lens for reading addition');
        }
      }

      if (lensType && lens.lensType === lensType) {
        matchScore += 10;
        matchReasons.push('Matches requested lens type');
      }

      if (lens.coating === 'ANTI_REFLECTIVE') {
        matchScore += 5;
        matchReasons.push('Anti-reflective coating included');
      } else if (lens.coating === 'BLUE_LIGHT') {
        matchScore += 5;
        matchReasons.push('Blue light protection included');
      } else if (lens.coating === 'PHOTOCHROMIC') {
        matchScore += 5;
        matchReasons.push('Photochromic (transitions) included');
      }

      if (matchReasons.length === 0) {
        matchReasons.push('Basic match');
      }

      recommendations.push({
        id: lens.id,
        name: lens.name,
        lensType: lens.lensType,
        index: lens.index,
        coating: lens.coating,
        salePrice: Number(lens.salePrice),
        supplier: lens.supplier,
        matchScore,
        matchReasons,
      });
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return recommendations.slice(0, 10);
  },
};
