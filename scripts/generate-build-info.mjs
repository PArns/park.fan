import fs from 'fs';
import path from 'path';
import https from 'https';

const owner = 'PArns';
const repo = 'park.fan';

function getCommitCountFromGitHub(owner, repo) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/commits?per_page=1`,
            method: 'GET',
            headers: {
                'User-Agent': 'BuildInfoScript',
                Accept: 'application/vnd.github+json',
            },
        };

        const req = https.get(options, (res) => {
            const linkHeader = res.headers.link;
            let count = 1;

            if (linkHeader) {
                const match = /page=(\d+)>; rel="last"/.exec(linkHeader);
                if (match) {
                    count = parseInt(match[1], 10);
                }
            }

            // Body sofort verwerfen, damit die Connection geschlossen wird
            res.resume();

            resolve(count);
        });

        req.on('error', (err) => {
            console.error('❌ Error fetching commit count:', err.message);
            // Fallback to 0 on error
            resolve(0);
        });
    });
}

async function generateBuildInfo() {
    try {
        const commitCount = await getCommitCountFromGitHub(owner, repo);

        const packageJsonPath = path.resolve(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const version = packageJson.version;

        const buildDate = new Date().toISOString();

        const buildInfo = {
            version,
            commitCount,
            buildDate,
            buildNumber: commitCount > 0 ? `${version}.${commitCount}` : version,
        };

        fs.writeFileSync('build-info.json', JSON.stringify(buildInfo, null, 2));
        console.log(`✅ Build info generated: ${JSON.stringify(buildInfo, null, 2)}`);
    } catch (err) {
        console.error('❌ Failed to generate build info:', err);
        // Create fallback build-info
        const fallback = {
            version: '0.1.0',
            commitCount: 0,
            buildDate: new Date().toISOString(),
            buildNumber: '0.1.0',
        };
        fs.writeFileSync('build-info.json', JSON.stringify(fallback, null, 2));
        console.log('⚠️  Using fallback build info');
    }
}

generateBuildInfo();
