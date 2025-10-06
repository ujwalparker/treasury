import { handler } from './build/handler.js';
import polka from 'polka';

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

polka()
	.use(handler)
	.listen(port, host, () => {
		console.log(`Server running on http://${host}:${port}`);
	});