import axios from 'axios';
import { Course } from '../types/Courses';

/**
 * Get an array of courses from tigercenter's api based on arguments
 * @param majorAbbrev The abbreviation of the course major
 * @param courseNumber The course number
 * @param section The section of the course
 */
export async function getClasses(
    majorAbbrev: string,
    courseNumber: string,
    section = ''
): Promise<Course[]> {
    const result = (
        await axios.post(
            'https://tigercenter.rit.edu/tigerCenterApp/tc/class-search',
            {
                searchParams: {
                    query: `${majorAbbrev} ${courseNumber} ${section}`.trim(),
                    term: '2201',
                    isAdvanced: false,
                    courseAttributeOptions: [],
                    courseAttributeOptionsPassed: []
                }
            }
        )
    ).data;
    if (result.found) {
        return result.searchResults as Course[];
    } else {
        return [];
    }
}
