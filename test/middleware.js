import test from 'tape';
import Rxmq from '../index';

// test
test('Rxmq middleware', (it) => {
    const channel = Rxmq.channel('test');
    const topic = 'test.topic';
    const mid = channel.subject(topic).middleware;

    it.test('# should support middleware', (t) => {
        t.ok(channel.subject(topic).middleware);
        t.end();
    });

    it.test('# should use subscribe middleware', (t) => {
        const suffix = '_appended';
        const testData = 'testGlobalPush';
        const sub = channel.subject(topic);

        sub.middleware.add((value) => value + suffix);

        sub.subscribe((val) => {
            t.equals(val, testData + suffix);
            t.end();
        });

        channel.subject(topic).onNext(testData);
    });

    it.test('# should use request middleware', (t) => {
        const rrTopic = 'request-reply';
        const rrSub = channel.subject(rrTopic);
        const rrMid = rrSub.middleware;
        const rrReplyMid = rrSub.replyMiddleware;
        const testRequest = 'test request';
        const testReply = 'test reply';
        const suffix = '_appended';

        // normal
        rrMid.add(({data, replySubject}) => {
            return {data: data + suffix, replySubject};
        });
        // reply
        rrReplyMid.add((val) => val + suffix);

        rrSub.subscribe(({data, replySubject}) => {
            t.equal(data, testRequest + suffix);
            replySubject.onNext(testReply);
            replySubject.onCompleted();
        });
        channel.request({topic: rrTopic, data: testRequest})
            .subscribe((replyData) => {
                t.equal(replyData, testReply + suffix);
                t.end();
            });
    });

    it.test('# should clean middleware', (t) => {
        mid.clear();
        mid.list()
            .startWith(0)
            .scan((acc) => acc + 1)
            .throttle()
            .subscribe((all) => {
                t.equal(all, 0);
                t.end();
            });
    });

    it.test('# should delete one middleware', (t) => {
        mid.clear();
        const m1 = mid.add(() => {});
        const m2 = mid.add(() => {});
        mid.remove(m1);
        mid.list()
            .subscribe((middleware) => {
                t.equal(middleware.name, m2.name);
                t.end();
            });
    });
});
